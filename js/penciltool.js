penciltool = new Tool();
var newPath;

penciltool.onMouseDown = function (event) {
	newPath = new Path({
		segments: [event.point],
		fullySelected: true,
	});
	window.cpath.addChild(newPath);
};

penciltool.onMouseUp = function (event) {
	if (newPath) {
		newPath.simplify(40);
		newPath.fullySelected = true;
		newPath.closed = true;
	}

	newPath = null;
};

penciltool.onMouseDrag = function (event) {
	if (newPath) {
		newPath.add(event.point);
	}
};
// penciltool.activate();

$("#pencil").click(function () {
	$("#toolbar button").removeClass("btn-outline-primary");
	$("#pencil").addClass("btn-outline-primary");
	penciltool.activate();
});
