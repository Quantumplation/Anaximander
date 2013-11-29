var paper, offset;

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
        
        loadAndDraw();
    });
}

function loadAndDraw() {
    // here be the dragons
    var tick = $("#tick-select").val();
    if (!tick) return;
    
    offset = {"x": document.documentElement.clientWidth / 2, "y": document.documentElement.clientHeight / 2};
    $("svg > g").empty();
    $.getJSON("http://quantumplation.me:4000/Anaximander/" + tick, function(data) {
        for (var i in data.report.stars) {
            var star = data.report.stars[i];
            paper.circle(star.x * 100 + offset.x, star.y * 100 + offset.y, 3).attr({"stroke": "gray", "stroke-width": "1", "fill": star.v == "1" ? "white" : "black"});
        }
    });
}

$(function() {
    paper = Raphael("container");
    new RaphaelZPD(paper, { zoom: true, pan: true, drag: false });
    
    // fuck you raphael
    var svg = document.querySelector("svg");
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.style.width = "100vw";
    svg.style.height = "100vh";
    
    getTickList();
    $("#reload").click(getTickList);
});