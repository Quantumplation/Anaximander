var paper, offset;

function loadAndDraw() {
    // here be the dragons
    offset = {"x": document.documentElement.clientWidth / 2, "y": document.documentElement.clientHeight / 2};
    $("svg > g *").remove();
    $.getJSON("http://quantumplation.me:4000/Anaximander", function(data) {
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
    
    loadAndDraw();
    $("#reload").click(loadAndDraw);
});