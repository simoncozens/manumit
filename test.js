import {
	normalizeLocation,
	supportScalar,
	VariationModel,
} from "./js/varmodel.js";
import { assert } from "chai";

describe("normalizeLocation", function () {
	it("should work", function () {
		var axes = [
			{ name: "weight", tag: "wght", minimum: 100, default: 400, maximum: 900 },
		];
		assert.deepEqual(normalizeLocation({ wght: 400 }, axes), { wght: 0.0 });
		assert.deepEqual(normalizeLocation({ wght: 100 }, axes), { wght: -1.0 });
		assert.deepEqual(normalizeLocation({ wght: 900 }, axes), { wght: 1.0 });
		assert.deepEqual(normalizeLocation({ wght: 650 }, axes), { wght: 0.5 });
		assert.deepEqual(normalizeLocation({ wght: 1000 }, axes), { wght: 1.0 });
		assert.deepEqual(normalizeLocation({ wght: 0 }, axes), { wght: -1.0 });

		axes = [
			{ name: "weight", tag: "wght", minimum: 0, default: 0, maximum: 1000 },
		];
		assert.deepEqual(normalizeLocation({ wght: 0 }, axes), { wght: 0.0 });
		assert.deepEqual(normalizeLocation({ wght: -1 }, axes), { wght: 0.0 });
		assert.deepEqual(normalizeLocation({ wght: 1000 }, axes), { wght: 1.0 });
		assert.deepEqual(normalizeLocation({ wght: 500 }, axes), { wght: 0.5 });
		assert.deepEqual(normalizeLocation({ wght: 1001 }, axes), { wght: 1.0 });

		axes = [
			{ name: "weight", tag: "wght", minimum: 0, default: 1000, maximum: 1000 },
		];
		assert.deepEqual(normalizeLocation({ wght: 0 }, axes), { wght: -1.0 });
		assert.deepEqual(normalizeLocation({ wght: -1 }, axes), { wght: -1.0 });
		assert.deepEqual(normalizeLocation({ wght: 500 }, axes), { wght: -0.5 });
		assert.deepEqual(normalizeLocation({ wght: 1000 }, axes), { wght: 0.0 });
		assert.deepEqual(normalizeLocation({ wght: 1001 }, axes), { wght: 0.0 });
	});
});

describe("normalizeLocation", function () {
	it("should work", function () {
		assert.equal(supportScalar({}, {}), 1.0);
		assert.equal(supportScalar({ wght: 0.2 }, {}), 1.0);
		assert.equal(supportScalar({ wght: 0.2 }, { wght: [0, 2, 3] }), 0.1);
		assert.equal(supportScalar({ wght: 2.5 }, { wght: [0, 2, 4] }), 0.75);
	});
});

describe("VariationModel", function () {
	it("should work", function () {
		let locations = [
			{ wght: 0.55, wdth: 0.0 },
			{ wght: -0.55, wdth: 0.0 },
			{ wght: -1.0, wdth: 0.0 },
			{ wght: 0.0, wdth: 1.0 },
			{ wght: 0.66, wdth: 1.0 },
			{ wght: 0.66, wdth: 0.66 },
			{ wght: 0.0, wdth: 0.0 },
			{ wght: 1.0, wdth: 1.0 },
			{ wght: 1.0, wdth: 0.0 },
		];
		let axisOrder = ["wght"];
		let sortedLocs = [
			{},
			{ wght: -0.55 },
			{ wght: -1.0 },
			{ wght: 0.55 },
			{ wght: 1.0 },
			{ wdth: 1.0 },
			{ wdth: 1.0, wght: 1.0 },
			{ wdth: 1.0, wght: 0.66 },
			{ wdth: 0.66, wght: 0.66 },
		];
		let supports = [
			{},
			{ wght: [-1.0, -0.55, 0] },
			{ wght: [-1.0, -1.0, -0.55] },
			{ wght: [0, 0.55, 1.0] },
			{ wght: [0.55, 1.0, 1.0] },
			{ wdth: [0, 1.0, 1.0] },
			{ wdth: [0, 1.0, 1.0], wght: [0, 1.0, 1.0] },
			{ wdth: [0, 1.0, 1.0], wght: [0, 0.66, 1.0] },
			{ wdth: [0, 0.66, 1.0], wght: [0, 0.66, 1.0] },
		];
		let deltaWeights = [
			{},
			{ 0: 1.0 },
			{ 0: 1.0 },
			{ 0: 1.0 },
			{ 0: 1.0 },
			{ 0: 1.0 },
			{ 0: 1.0, 4: 1.0, 5: 1.0 },
			{
				0: 1.0,
				3: 0.7555555555555555,
				4: 0.24444444444444444,
				5: 1.0,
				6: 0.66,
			},
			{
				0: 1.0,
				3: 0.7555555555555555,
				4: 0.24444444444444444,
				5: 0.66,
				6: 0.43560000000000006,
				7: 0.66,
			},
		];
		let model = new VariationModel(locations, axisOrder);
		assert.deepEqual(model.locations, sortedLocs);
		assert.deepEqual(model.supports, supports);
		assert.deepEqual(model.deltaWeights, deltaWeights);
	});
});
