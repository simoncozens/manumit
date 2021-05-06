function setup_handtool() {
	var handtool = new Tool();
	var newPath;

	handtool.onMouseDrag = function (e) {
		console.log("Hand drag");
		project.view.matrix = project.view.matrix.translate(
			e.event.movementX,
			-e.event.movementY
		);
	};

	$("#hand").click(function () {
		$("#toolbar button").removeClass("btn-outline-primary");
		$("#hand").addClass("btn-outline-primary");
		handtool.activate();
	});
}
