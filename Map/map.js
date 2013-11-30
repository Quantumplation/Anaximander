var paper, offset, scale;
var dumps = {};

var layers = {
    scanning: { enabled: true, func: drawSensorRange },
    stars: {enabled: true, func: drawStars },
    econHeatmap: {enabled: true, func: drawEconHeatmap }
}

function getTickList() {
    $.get("http://quantumplation.me:4000/Anaximander", function(data) {
        var select = $("#tick-select");
        var t = select.val();
        select.empty();
        
        var ticks = data.split("\n");
        for (var i in ticks) {
            if (ticks[i])
                select.append("<option value='" + ticks[i] + "'>" + ticks[i] + "</option>");
        }
        
        if (t)
            select.val(t);
        else
            select.children(":last").attr("selected", "selected");
        
        loadAndDraw($("#tick-select").val());
    });
}

function loadAndDraw(tick) {
    if (!tick) return;

    //Data about the universe, obtained from the game
    var stellarData;
    
    //Metadata about the universe, generated by us
    var strategicData;

    // Cache the tick data so we can remove redundant requests.
    if(tick in dumps)
    {
        stellarData = dumps[tick].stellarData;
        strategicData = dumps[tick].strategicData;
        draw(stellarData, strategicData);
    }

    
    $.getJSON("http://quantumplation.me:4000/Anaximander/data/" + tick, function(data)
    {
        stellarData = data;
        dumps[tick] = {};
        dumps[tick].stellarData = data;
        
        $.getJSON("http://quantumplation.me:4000/Anaximander/strategic", function(data)
        {
            dumps[tick].strategicData = data;
            strategicData = data;            
            draw(stellarData, strategicData);
        })
    });
}

function draw(stellarData, strategicData) {
    offset = {"x": document.documentElement.clientWidth / 2, "y": document.documentElement.clientHeight / 2};   
    scale = 100;
    $("svg > g").empty();

    calculateRenderData(stellarData, strategicData);
    calculateEconHeatmap(stellarData, strategicData);

    $("#layers").empty();
    $("#layers").append("<label>Layers:</label><br/>")
    for(l in layers) {
        $("#layers").append("<a href=\"#\" class=\"link\" id=\"" + l + "\">" + l + "</a><br/>");
        $("#" + l).click(function(){
            layers[this.id].enabled = !layers[this.id].enabled;
            loadAndDraw($("#tick-select").val());
        });
        var layer = layers[l];
        if(layer.enabled)
            layer.func(stellarData, strategicData);
    }
    drawFleets(stellarData, strategicData);
    drawLegend(stellarData, strategicData);
}

function calculateRenderData(stellarData, strategicData) {
    for (var pid in stellarData.report.players) {
        var player = stellarData.report.players[pid];
        player.renderData = {};
    }
    
    calculatePlayerIcons(stellarData, strategicData);
    calculatePlayerSensorRange(stellarData, strategicData);
}

//go through all players and augment the layer renderdata with player color/icon
function calculatePlayerIcons(stellarData, strategicData) {
    for (var pid in stellarData.report.players) {
        var player = stellarData.report.players[pid];

        if (player.ai == 1 || player.conceded == 1) { //Conceded check might be pointless, all conceded players are AIs?
            player.renderData.color = "hotpink";
        } else {        
            var playerAlliance = strategicData.playerAllianceMembership[player.uid];
            if (playerAlliance != undefined) {
                alliance = strategicData.alliances[playerAlliance];
                player.renderData.color = alliance.color;
            } else {
                player.renderData.color = "gray";
            }
        }
    }
}

function calculatePlayerSensorRange(stellarData, strategicData) {
    for (var pid in stellarData.report.players) {
        var player = stellarData.report.players[pid];
        var sensorTechLevel = player.tech.scanning.level;
        var sensorRange = sensorTechLevel + 2;
        
        player.renderData.sensorRange = sensorRange;
    }
}

function calculateEconHeatmap(stellarData, strategicData) {
    var econData = {
        max: 0,
        data: []
    }
    for(var i in stellarData.report.stars){
        var star = stellarData.report.stars[i];
        if(econData.max < star.e)
            econData.max = star.e;
        if(star.e > 0)
            econData.data.push({x: star.x * scale + offset.x, y: star.y * scale + offset.y, count: star.e});
    }
    strategicData.econData = econData;
}

//This is a little difficult, we really want multiple layers
//layers can be done with raphael by using multiple different Raphael objects (http://stackoverflow.com/questions/5556421/how-to-create-multiple-layer-images-using-raphael-canvas-library)
//so maybe that should be done sometime
function drawSensorRange(stellarData, strategicData) {
    // First pass for anyone who's not in our alliance
    for(a in strategicData.alliances)
    {
        var alliance = strategicData.alliances[a];
        sensorPass(a, alliance.color, stellarData, strategicData);
    }
}

function sensorPass(alliance, color, stellarData, strategicData)
{
    for (var i in stellarData.report.stars) {
        var star = stellarData.report.stars[i];
        
        if (star.puid == -1 || strategicData.playerAllianceMembership[star.puid] != alliance)
            continue;
            
        var player = stellarData.report.players[star.puid];
        var sensorRange = player.renderData.sensorRange / 10;
        
        paper.circle(star.x * scale + offset.x, star.y * scale + offset.y, sensorRange * scale)
            .attr({"stroke": color, "stroke-width":1});
    }

    // We loop though twice to make sure that all the borders are rendered first, THEN the sensor range erases them.
    for(var i in stellarData.report.stars) {
        var star = stellarData.report.stars[i];
        
        if (star.puid == -1 || strategicData.playerAllianceMembership[star.puid] != alliance)
            continue;
            
        var player = stellarData.report.players[star.puid];
        var sensorRange = player.renderData.sensorRange / 10;

        paper.circle(star.x * scale + offset.x, star.y * scale + offset.y, sensorRange * scale - 0.5)
            .attr({"fill": "black"});

    }
}

function drawStars(stellarData, strategicData) {
    for (var i in stellarData.report.stars) {
        var star = stellarData.report.stars[i];
        
        var color;
        if (star.puid == -1)                                                        //If the star is not owned then render is as either visible or not
            color = star.v == "0" ? "black" : "white";
        else                                                                        //If the star *is* owned, draw it with player colors (and icon, when that's done)
            color = stellarData.report.players[star.puid].renderData.color;
        
        paper.circle(star.x * scale + offset.x, star.y * scale + offset.y, 0.03 * scale)
            .attr({"stroke": "gray", "stroke-width": "1", "fill": color});
    }
}

function drawFleets(stellarData, strategicData) {
}

function drawLegend(stellarData, strategicData) {
    $("#players").empty().append("Reported players: <br/>");
    var techs = {
        "scanning": "Scanning",
        "propulsion": "Hyperspace Range",
        "terraforming": "Terraforming",
        "research": "Experimentation",
        "weapons": "Weapons",
        "banking": "Banking",
        "manufacturing": "Manufacturing"
    };
    for(var i in stellarData.report.players) {
        var player = stellarData.report.players[i];

        if(player.reported) {
            var tech = player.tech[player.researching];
            var n = Number(tech.level) * Number(tech.brr);
            var s = n - Number(tech.research);
            var ticks = Math.ceil(s / player.total_science);
            $("#players").append(player.alias + ": " + techs[player.researching] + " (" + ticks + " ticks remaining)<br/>");
        }
    }
}

var heatmapMade = false;
function drawEconHeatmap(stellarData, strategicData) {
    if(!heatmapMade){
        // heatmap configuration
        var config = {
            element: document.getElementById("econHeatmap"),
            radius: 30,
            opacity: 50
        };
        
        //creates and initializes the heatmap
        var heatmap = h337.create(config);
     
        heatmap.store.setDataSet(strategicData.econData);
        heatmapMade = true;
    }
}

$(function() {
    paper = Raphael("container");

    
    //This ZPD thing is really ugly.
    //It's flagging deprecated event usage, using paper.clear breaks it, and it has no way to programatically set the zoom as far as I can see
    new RaphaelZPD(paper, { zoom: true, pan: true, drag: false });
    
    // fuck you raphael
    var svgs = document.querySelectorAll("svg");
    $.each(svgs, function(s, svg){
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.style.width = "100vw";
        svg.style.height = "100vh";
    });
    
    getTickList();
    $("#reload").click(getTickList);
});