var paper, offset, scale;
var dumps = {};

var layers = {
    scanning: { enabled: true, func: drawSensorRange },
    hyperspace: {enabled: true, func: drawHyperspace },
    stars: {enabled: true, func: drawStars },
    fleets: {enabled: true, func: drawFleets }
}

function position(x, y) {
    return { x: x * scale + offset.x, y: y * scale + offset.y };
}

function length(lightyears) {
    return lightyears * 0.125;
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
    else
    {
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
            }).fail(function(a, b) { console.log(b); });
        });
    }
}

function draw(stellarData, strategicData) {
    offset = {"x": document.documentElement.clientWidth / 2, "y": document.documentElement.clientHeight / 2};   
    scale = 100;
    $("svg > g").empty();

    calculateRenderData(stellarData, strategicData);

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
    drawLegend(stellarData, strategicData);
}

function calculateRenderData(stellarData, strategicData) {
    for (var pid in stellarData.report.players) {
        var player = stellarData.report.players[pid];
        player.renderData = {};
    }
    
    calculatePlayerIcons(stellarData, strategicData);
    calculatePlayerSensorRange(stellarData, strategicData);
    calculatePlayerHyperspaceRange(stellarData, strategicData);
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

function calculatePlayerHyperspaceRange(stellarData, strategicData) {
    for (var pid in stellarData.report.players) {
        var player = stellarData.report.players[pid];
        var hyperspaceTechLevel = player.tech.propulsion.level;
        var hyperspaceRange = hyperspaceTechLevel + 3;
        
        player.renderData.hyperspaceRange = hyperspaceRange;
    }
}

function drawSensorRange(stellarData, strategicData) {
    // First pass for anyone who's not in our alliance
    for(var a in strategicData.alliances)
    {
        var alliance = strategicData.alliances[a];
        allianceRadiusDataPass(a, alliance.color, stellarData, strategicData, function(player) {
             return length(player.renderData.sensorRange) * scale;
        });
    }
}

function allianceRadiusDataPass(alliance, color, stellarData, strategicData, radiusFunc) {
    for (var i in stellarData.report.stars) {
        var star = stellarData.report.stars[i];
        
        if (star.puid == -1 || strategicData.playerAllianceMembership[star.puid] != alliance)
            continue;
            
        var player = stellarData.report.players[star.puid];
        var radius = radiusFunc(player);
        
        var p = position(star.x, star.y);
        paper.circle(p.x, p.y, radius)
            .attr({"stroke": color, "stroke-width":1});
    }

    // We loop though twice to make sure that all the borders are rendered first, THEN the sensor range erases them.
    for(var i in stellarData.report.stars) {
        var star = stellarData.report.stars[i];
        
        if (star.puid == -1 || strategicData.playerAllianceMembership[star.puid] != alliance)
            continue;
            
        var player = stellarData.report.players[star.puid];
        var radius = radiusFunc(player);

        var p = position(star.x, star.y);
        paper.circle(p.x, p.y, radius - 0.5)
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
        
        var p = position(star.x, star.y);
        paper.circle(p.x, p.y, 0.03 * scale)
            .attr({"stroke": "gray", "stroke-width": "1", "fill": color});
    }
}

function drawFleets(stellarData, strategicData) {
    for (var fid in stellarData.report.fleets) {
        var fleet = stellarData.report.fleets[fid];
        
        if (fleet.o.length == 0) continue;
        
        var attackRun = false;
        var positions = [ position(fleet.x, fleet.y) ];
        for (var oid = 0; oid < fleet.o.length; oid++) {
            var order = fleet.o[oid];
            //order is an array:
            //[0] = ?? No idea! I've only ever seen this as zero. I *guess* looping?
            //[1] = Star ID
            //[2] = ?? I *guess* action type on star (e.g. garrison)
            //[3] = ?? I *guess* parameter to action (e.g. garrison 1)
            
            var star = stellarData.report.stars[order[1]];
            positions.push(position(star.x, star.y));
            
            if (star.puid != fleet.puid && star.puid != -1) {
                attackRun = true;
            }
        }
        
        var line = "M" + positions[0].x + " " + positions[0].y;
        for (var i = 1; i < positions.length; i++) {
            line += "L" + positions[i].x + " " + positions[i].y;
        }
        
        var color = attackRun ? "crimson" : "white";
        
        paper.path(line)
            .attr({"stroke": color, "stroke-width":1});
            
        paper.circle(positions[0].x, positions[0].y, scale * 0.02)
            .attr({"fill": color})
            .attr({"stroke": "gray", "stroke-width":1});
    }
}

function drawHyperspace(stellarData, strategicData) {
    for(var a in strategicData.alliances)
    {
        var alliance = strategicData.alliances[a];
        allianceRadiusDataPass(a, alliance.color, stellarData, strategicData, function(player) {
             return length(player.renderData.hyperspaceRange) * scale;
        });
    }
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