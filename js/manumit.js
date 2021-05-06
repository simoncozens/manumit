import { VariationModel, normalizeValue } from "./varmodel.js";

var canvas = document.getElementById("canvas");

$(function () {
    paper.setup(canvas);
    paper.install(window);

    paper.settings.handleSize = 8;

    window.cpath = new CompoundPath({ selected: true });
    cpath.fillColor = "#aaaaff44";
    cpath.fillRule = "nonzero";
    cpath.strokeWidth = 1;
    cpath.strokeColor = "blue";

    project.view.matrix = new Matrix(1.0, 0, 0, -1.0, 300, 600);

    window.axis = {
        name: "weight",
        tag: "wght",
        minimum: 28,
        maximum: 194,
        default: 94,
    };

    var slider_div = $('<div class="col-sm-10">');
    var slider = $("<input>");
    slider.attr("type", "range");
    slider.addClass("form-range");
    slider.attr("min", axis.minimum);
    slider.attr("max", axis.maximum);
    slider.attr("value", axis.default);
    slider.attr("id", "slider-" + axis.name);
    slider_div.append(slider);

    var slider_label = $('<label class="col-sm-1 col-form-label">');
    slider_label.append(axis.name);

    $("#axissliders").append(slider_label);
    $("#axissliders").append(slider_div);
    $("#axissliders div input").on("input", function () {
        var loc = "wght=" + $("#axissliders div input").val();
        $("#location").html(loc);
        window.drawGlyph(loc);
    });

    window.glyph = [
        { "wght=94": [-101, 0] },
        { "wght=94": [240, -10] },
        { "wght=94": [32, 0] },
        { "wght=94": [-17, -8] },
        { "wght=94": [329, 6] },
        { "wght=94": [0, 0] },
        { "wght=94": [0, 0] },
        { "wght=94": [329, 50] },
        { "wght=94": [-21, -4] },
        { "wght=94": [24, 0] },
        { "wght=94": [265, 43] },
        { "wght=94": [-46, 0] },
        { "wght=94": [0, -68] },
        { "wght=94": [189, 142] },
        { "wght=94": [0, 0] },
        { "wght=94": [0, 0] },
        { "wght=94": [189, 479] },
        { "wght=94": [0, 0] },
        { "wght=94": [0, 0] },
        { "wght=94": [320, 479] },
        { "wght=94": [0, 0] },
        { "wght=94": [0, 0] },
        { "wght=94": [320, 536] },
        { "wght=94": [0, 0] },
        { "wght=94": [0, 0] },
        { "wght=94": [189, 536] },
        { "wght=94": [0, 0] },
        { "wght=94": [0, 0] },
        { "wght=94": [189, 659] },
        { "wght=94": [0, 0] },
        { "wght=94": [0, 0] },
        { "wght=94": [143, 659] },
        { "wght=94": [-10, -51] },
        { "wght=94": [23, 24] },
        { "wght=94": [97, 551] },
        { "wght=94": [-22, -23] },
        { "wght=94": [24, 0] },
        { "wght=94": [19, 519] },
        { "wght=94": [0, 0] },
        { "wght=94": [0, 0] },
        { "wght=94": [19, 479] },
        { "wght=94": [0, 0] },
        { "wght=94": [0, 0] },
        { "wght=94": [95, 479] },
        { "wght=94": [0, 0] },
        { "wght=94": [0, 0] },
        { "wght=94": [95, 145] },
        { "wght=94": [0, -115] },
    ];

    function string2loc(s) {
        var axes = s.split(",");
        var out = {};
        axes.forEach(function (loc) {
            var t = loc.split("=");
            var value = parseInt(t[1], 10);
            if (value != window.axis.default) {
                out[t[0]] = normalizeValue(value, axis);
            }
        });
        return out;
    }

    window.drawGlyph = function (position) {
        var loc = string2loc(position);
        console.log("Loc", loc);
        var coords = glyph.map(function (e) {
            var locations = [];
            var xPositions = [];
            var yPositions = [];
            Object.keys(e).forEach(function (location) {
                locations.push(string2loc(location));
                xPositions.push(e[location][0]);
                yPositions.push(e[location][1]);
            });
            var model = new VariationModel(locations);
            let x = model.interpolateFromMasters(loc, xPositions);
            let y = model.interpolateFromMasters(loc, yPositions);
            return new Point(x, y);
        });
        var path = new Path({});
        cpath.removeChildren();
        cpath.addChild(path);
        for (var i = 1; i < coords.length; i += 3) {
            var index = (i - 1) / 3;
            var segment = new Segment(coords[i], coords[i - 1], coords[i + 1]);
            path.add(segment);
        }
        path.closed = true;
        path.fullySelected = true;
        console.log(path);
    };

    drawGlyph("wght=94");

    var baseline = new Path.Line(new Point(-1000, 0), new Point(1000, 0));
    baseline.strokeWidth = 2;
    baseline.strokeColor = "#aaaaaa";

    var capheight = new Path.Line(
        new Point(-1000, parseInt($("#capheight").val(), 10)),
        new Point(1000, parseInt($("#capheight").val(), 10))
    );
    capheight.strokeWidth = 1;
    capheight.strokeColor = "#aaaaaa";
    $("#capheight").change(function () {
        capheight.segments[0].point.y = capheight.segments[1].point.y = parseInt(
            $("#capheight").val(),
            10
        );
    });

    var xheight = new Path.Line(
        new Point(-1000, parseInt($("#xheight").val(), 10)),
        new Point(1000, parseInt($("#xheight").val(), 10))
    );
    xheight.strokeWidth = 1;
    xheight.strokeColor = "#aaaaaa";
    $("#xheight").change(function () {
        xheight.segments[0].point.y = xheight.segments[1].point.y = parseInt(
            $("#xheight").val(),
            10
        );
    });

    var hitOptions = {
        segments: true,
        stroke: true,
        fill: false,
        handles: true,
        tolerance: 5,
    };

    view.onDoubleClick = function (event) {
        var hitResult = project.hitTest(event.point, hitOptions);
        if (!hitResult) return;

        if (hitResult.type == "segment") {
            hitResult.segment.remove();
        }
        if (hitResult.type == "handle-out") {
            hitResult.segment.handleOut.set(0, 0);
        }
        if (hitResult.type == "handle-in") {
            hitResult.segment.handleIn.set(0, 0);
        }
        return;
    };

    canvas = document.getElementById("canvas");
    canvas.addEventListener("wheel", function (e) {
        var point = view.viewToProject(paper.DomEvent.getOffset(e, canvas));
        var scale = e.deltaY * -0.005;
        project.view.matrix = project.view.matrix.scale(1 + scale, point);
    });

    view.draw();
    setup_handtool();
    setup_pentool();
});
