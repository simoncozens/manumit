function updateMastersList() {
    $("#mastersList").empty();
    var masters = {};
    for (var node of window.glyph) {
        for (var master in node) {
            masters[master] = 1;
        }
    }
    for (var master of Object.keys(masters)
        .map(function (f) {
            return parseInt(f.replace("wght=", ""), 10);
        })
        .sort(function (a, b) {
            return a - b;
        })) {
        var button = $('<button class="btn mx-2 btn-primary"/>');
        button.append("wght=" + master);
        button.data("master", master);

        button.click(function (e) {
            loc = "wght=" + $(this).data("master");
            $("#axissliders div input").val($(this).data("master"));
            window.drawGlyph(loc);
        });
        $("#mastersList").append(button);
    }
}

function is_nearly_collinear(d1, d2) {
    if (Math.abs(d2.rotate(180, new Point(0, 0)).angle - d1.angle) < 5) {
        return true;
    }
    return false;
}
function setup_pentool() {
    pentool = new Tool();
    var hitOptions = {
        segments: true,
        stroke: true,
        fill: false,
        handles: true,
        tolerance: 5,
    };

    var segment, path, handle;

    function do_add(point, index, delta) {
        point.set(point.x + delta.x, point.y + delta.y);
        window.glyph[index]["wght=" + $("#axissliders div input").val()] = [
            point.x,
            point.y,
        ];
        updateMastersList();
    }
    function do_set(point, index, pt2) {
        point.set(pt2.x, pt2.y);
        window.glyph[index]["wght=" + $("#axissliders div input").val()] = [
            point.x,
            point.y,
        ];
    }
    pentool.onMouseDown = function (event) {
        segment = path = handle = null;
        var hitResult = window.cpath.hitTest(event.point, hitOptions);
        if (!hitResult) {
            return;
        }
        path = hitResult.item;
        if (hitResult.type == "segment") {
            segment = hitResult.segment;
            if (event.modifiers.shift) {
                segment.smooth();
            }
        } else if (hitResult.type == "handle-out") {
            handle = "out";
            segment = hitResult.segment;
        } else if (hitResult.type == "handle-in") {
            handle = "in";
            segment = hitResult.segment;
        } else if (hitResult.type == "stroke") {
            // var location = hitResult.location;
            // segment = path.insert(location.index + 1, event.point);
            // segment.smooth();
            // path.fullySelected = true;
        }
    };

    pentool.onMouseDrag = function (event) {
        if (handle) {
            if (handle == "in") {
                if (
                    !event.modifiers.shift &&
                    is_nearly_collinear(segment.handleOut, segment.handleIn)
                ) {
                    do_add(segment.handleIn, segment.index * 3, event.delta);
                    do_set(
                        segment.handleOut,
                        segment.index * 3 + 2,
                        segment.handleIn
                            .rotate(180, new Point(0, 0))
                            .normalize(segment.handleOut.length)
                    );
                } else {
                    do_add(segment.handleIn, segment.index * 3, event.delta);
                }
            } else {
                if (
                    !event.modifiers.shift &&
                    is_nearly_collinear(segment.handleOut, segment.handleIn)
                ) {
                    do_add(
                        segment.handleOut,
                        segment.index * 3 + 2,
                        event.delta
                    );
                    do_set(
                        segment.handleIn,
                        segment.index * 3,
                        segment.handleOut
                            .rotate(180, new Point(0, 0))
                            .normalize(segment.handleIn.length)
                    );
                } else {
                    do_add(
                        segment.handleOut,
                        segment.index * 3 + 2,
                        event.delta
                    );
                }
            }
        } else if (segment) {
            do_add(segment.point, segment.index * 3 + 1, event.delta);
        }
    };

    $("#pen").click(function () {
        $("#toolbar button").removeClass("btn-outline-primary");
        $("#pen").addClass("btn-outline-primary");
        pentool.activate();
    });
    pentool.activate();
}
