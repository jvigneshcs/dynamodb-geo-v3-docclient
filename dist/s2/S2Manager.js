"use strict";
/*
 * Copyright 2010-2013 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.S2Manager = void 0;
const s2js_1 = require("s2js");
const { Cell: S2Cell, LatLng: S2LatLng } = s2js_1.s2;
class S2Manager {
    static generateGeohash(geoPoint) {
        const latLng = S2LatLng.fromDegrees(geoPoint.latitude, geoPoint.longitude);
        const cell = S2Cell.fromLatLng(latLng);
        const cellId = cell.id; // This is already a bigint in s2js
        return cellId;
    }
    static generateHashKey(geohash, hashKeyLength) {
        if (geohash.lessThan(0)) {
            // Counteract "-" at beginning of geohash.
            hashKeyLength++;
        }
        const geohashString = geohash.toString(10);
        const denominator = Math.pow(10, geohashString.length - hashKeyLength);
        return geohash.divide(denominator);
    }
}
exports.S2Manager = S2Manager;
