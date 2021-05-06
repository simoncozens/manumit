function isSuperset(set, subset) {
    for (let elem of subset.values()) {
        if (!set.has(elem)) {
            return false;
        }
    }
    return true;
}
function subList(truth, list) {
    return list.filter((it, ix) => truth[ix]);
}
export function normalizeValue(v, axis) {
    v = Math.max(Math.min(v, axis.maximum), axis.minimum);
    if (v < axis.default) {
        return (v - axis.default) / (axis.default - axis.minimum);
    }
    if (v > axis.default) {
        return (v - axis.default) / (axis.maximum - axis.default);
    }
    return 0;
}
export function normalizeLocation(location, axes) {
    var out = {};
    for (var axis of axes) {
        var loc_value;
        if (axis.tag in location) {
            loc_value = location[axis.tag];
        }
        else {
            loc_value = axis.default;
        }
        out[axis.tag] = normalizeValue(loc_value, axis);
    }
    return out;
}
export function supportScalar(location, support) {
    let scalar = 1;
    for (var tag in support) {
        let [lower, peak, upper] = support[tag];
        if (peak == 0) {
            continue;
        }
        if (lower > peak || peak > upper) {
            continue;
        }
        if (lower < 0 && upper > 0) {
            continue;
        }
        var v = location[tag] || 0;
        if (v == peak) {
            continue;
        }
        if (v <= lower || upper <= v) {
            scalar = 0;
            break;
        }
        if (v < peak) {
            scalar *= (v - lower) / (peak - lower);
        }
        else {
            scalar *= (v - upper) / (peak - upper);
        }
    }
    return scalar;
}
export class VariationModel {
    constructor(locations, axisOrder) {
        this.axisOrder = [];
        this.origLocations = locations;
        this.deltaWeights = []; // Make compiler happier
        this.supports = []; // Make compiler happier
        var loc2 = [];
        for (var loc of this.origLocations) {
            loc2.push(Object.keys(loc)
                .filter((tag) => loc[tag] != 0)
                .reduce((obj, key) => {
                obj[key] = loc[key];
                return obj;
            }, {}));
        }
        var [keyFunc, axisPoints] = this.getMasterLocationsSortKeyFunc(loc2, this.axisOrder);
        this.locations = loc2.sort(keyFunc);
        this.mapping = this.origLocations.map((l) => this.locations.map((x) => JSON.stringify(x)).indexOf(JSON.stringify(l)));
        this.reverseMapping = this.locations.map((l) => this.origLocations
            .map((x) => JSON.stringify(x))
            .indexOf(JSON.stringify(l)));
        this._computeMasterSupports(axisPoints);
        this._subModels = new Map();
    }
    getSubModel(items) {
        if (!items.some((x) => x == null)) {
            return [this, items];
        }
        let key = items.filter((x) => x != null);
        let submodel = this._subModels.get(key);
        if (!submodel) {
            submodel = new VariationModel(subList(key, this.origLocations), []);
            this._subModels.set(key, submodel);
        }
        return [submodel, subList(key, items)];
    }
    getMasterLocationsSortKeyFunc(locations, axisOrder) {
        var axisPoints = {};
        for (var loc of locations) {
            if (Object.keys(loc).length != 1) {
                continue;
            }
            let axis = Object.keys(loc)[0];
            let value = loc[axis];
            if (!(axis in axisPoints)) {
                axisPoints[axis] = new Set().add(0);
            }
            axisPoints[axis].add(value);
        }
        var func = function (a, b) {
            var keyLen = Object.keys(a).length - Object.keys(b).length;
            if (keyLen != 0) {
                return keyLen;
            }
            var onpoint_a = Object.keys(a).filter((axis) => {
                axis in axisPoints && axisPoints[axis].has(a[axis]);
            });
            var onpoint_b = Object.keys(b).filter((axis) => {
                axis in axisPoints && axisPoints[axis].has(b[axis]);
            });
            var onpoint = onpoint_a.length - onpoint_b.length;
            if (onpoint != 0) {
                return onpoint;
            }
            for (var axis of Object.keys(a)) {
                if (Math.sign(a[axis]) != Math.sign(b[axis])) {
                    return Math.sign(a[axis]) - Math.sign(b[axis]);
                }
            }
            return 0;
        };
        return [func, axisPoints];
    }
    _computeMasterSupports(axisPoints) {
        let supports = [];
        let regions = this._locationsToRegions();
        for (var i in regions) {
            var region = regions[i];
            let locAxes = new Set(Object.keys(region));
            for (var j in [...Array(i).keys()]) {
                var prev_region = regions[j];
                if (!isSuperset(locAxes, new Set(Object.keys(prev_region)))) {
                    continue;
                }
                var relevant = true;
                for (var axis of Object.keys(region)) {
                    var [lower, peak, upper] = region[axis];
                    if (!(axis in prev_region) ||
                        !(prev_region[axis][1] == peak ||
                            (lower < prev_region[axis][1] && prev_region[axis][1] < upper))) {
                        relevant = false;
                        break;
                    }
                }
                if (!relevant) {
                    continue;
                }
                // Split the box
                let bestAxes = {};
                let bestRatio = -1;
                for (axis in prev_region) {
                    let val = prev_region[axis][1];
                    console.assert(axis in region);
                    let [lower, locV, upper] = region[axis];
                    let [newLower, newUpper] = [lower, upper];
                    var ratio;
                    if (val < locV) {
                        newLower = val;
                        ratio = (val - locV) / (lower - locV);
                    }
                    else if (locV < val) {
                        newUpper = val;
                        ratio = (val - locV) / (upper - locV);
                    }
                    else {
                        // Can't split box in this direction.
                        continue;
                    }
                    if (ratio > bestRatio) {
                        bestAxes = {};
                        bestRatio = ratio;
                    }
                    if (ratio == bestRatio) {
                        bestAxes[axis] = [newLower, locV, newUpper];
                    }
                }
                for (var axis in bestAxes) {
                    region[axis] = bestAxes[axis];
                }
            }
            supports.push(region);
        }
        this.supports = supports;
        this._computeDeltaWeights();
    }
    _locationsToRegions() {
        let locations = this.locations;
        let minV = {};
        let maxV = {};
        for (var l of locations) {
            for (var k of Object.keys(l)) {
                let v = l[k];
                if (!(k in minV)) {
                    minV[k] = v;
                }
                if (!(k in maxV)) {
                    maxV[k] = v;
                }
                minV[k] = Math.min(v, minV[k]);
                maxV[k] = Math.max(v, maxV[k]);
            }
        }
        let regions = [];
        for (var i in locations) {
            let loc = locations[i];
            let region = {};
            for (var axis in loc) {
                let locV = loc[axis];
                if (locV > 0) {
                    region[axis] = [0, locV, maxV[axis]];
                }
                else {
                    region[axis] = [minV[axis], locV, 0];
                }
            }
            regions.push(region);
        }
        return regions;
    }
    _computeDeltaWeights() {
        let deltaWeights = [];
        this.locations.forEach((loc, i) => {
            let deltaWeight = {};
            this.locations.slice(0, i).forEach((m, j) => {
                let scalar = supportScalar(loc, this.supports[j]);
                if (scalar) {
                    deltaWeight[j] = scalar;
                }
            });
            deltaWeights.push(deltaWeight);
        });
        this.deltaWeights = deltaWeights;
    }
    getDeltas(masterValues) {
        console.assert(masterValues.length == this.deltaWeights.length);
        let mapping = this.reverseMapping;
        let out = [];
        this.deltaWeights.forEach((weights, i) => {
            let delta = masterValues[mapping[i]];
            for (var j in weights) {
                var weight = weights[j];
                if (weight == 1) {
                    delta -= out[j];
                }
                else {
                    delta -= out[j] * weight;
                }
            }
            out.push(delta);
        });
        return out;
    }
    getScalars(loc) {
        return this.supports.map((support) => supportScalar(loc, support));
    }
    interpolateFromDeltasAndScalars(deltas, scalars) {
        let v = null;
        console.assert(deltas.length == scalars.length);
        deltas.forEach((delta, ix) => {
            let scalar = scalars[ix];
            if (!scalar) {
                return;
            }
            let contribution = delta * scalar;
            if (v == null) {
                v = contribution;
            }
            else {
                v += contribution;
            }
        });
        return v;
    }
    interpolateFromDeltas(loc, deltas) {
        let scalars = this.getScalars(loc);
        return this.interpolateFromDeltasAndScalars(deltas, scalars);
    }
    interpolateFromMasters(loc, masterValues) {
        let deltas = this.getDeltas(masterValues);
        return this.interpolateFromDeltas(loc, deltas);
    }
    interpolateFromMastersAndScalars(masterValues, scalars) {
        let deltas = this.getDeltas(masterValues);
        return this.interpolateFromDeltasAndScalars(deltas, scalars);
    }
}
