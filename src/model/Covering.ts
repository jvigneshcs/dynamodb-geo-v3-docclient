import { s2 } from "s2js";
import { GeohashRange } from "./GeohashRange";
import Long from "long";

export class Covering {
    private cellIds: bigint[];

    constructor (cellIds: bigint[]) {
        this.cellIds = cellIds;
    }

    public getGeoHashRanges(hashKeyLength: number) {
        const ranges: GeohashRange[] = [];
        this.cellIds.forEach(cellId => {
            // s2js: cellId is bigint, use cellid functions to get range and convert to Long
            const min = Long.fromString(s2.cellid.rangeMin(cellId).toString(), false, 10);
            const max = Long.fromString(s2.cellid.rangeMax(cellId).toString(), false, 10);
            const hashRange = new GeohashRange(min, max);
            ranges.push(...hashRange.trySplit(hashKeyLength));
        });
        return ranges;
    }

    public getNumberOfCells() {
        return this.cellIds.length;
    }
}
