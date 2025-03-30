"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Covering = void 0;
const GeohashRange_1 = require("./GeohashRange");
class Covering {
    cellIds;
    constructor(cellIds) {
        this.cellIds = cellIds;
    }
    getGeoHashRanges(hashKeyLength) {
        const ranges = [];
        this.cellIds.forEach(outerRange => {
            const hashRange = new GeohashRange_1.GeohashRange(outerRange.rangeMin().id, outerRange.rangeMax().id);
            ranges.push(...hashRange.trySplit(hashKeyLength));
        });
        return ranges;
    }
    getNumberOfCells() {
        return this.cellIds.length;
    }
}
exports.Covering = Covering;
