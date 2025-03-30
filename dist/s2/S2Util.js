"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S2Util = void 0;
const nodes2ts_1 = require("nodes2ts");
class S2Util {
    static latLngRectFromQueryRectangleInput(geoQueryRequest) {
        const queryRectangleRequest = geoQueryRequest;
        const minPoint = queryRectangleRequest.MinPoint;
        const maxPoint = queryRectangleRequest.MaxPoint;
        let latLngRect = null;
        if (minPoint != null && maxPoint != null) {
            const minLatLng = nodes2ts_1.S2LatLng.fromDegrees(minPoint.latitude, minPoint.longitude);
            const maxLatLng = nodes2ts_1.S2LatLng.fromDegrees(maxPoint.latitude, maxPoint.longitude);
            latLngRect = nodes2ts_1.S2LatLngRect.fromLatLng(minLatLng, maxLatLng);
        }
        return latLngRect;
    }
    static getBoundingLatLngRectFromQueryRadiusInput(geoQueryRequest) {
        const centerPoint = geoQueryRequest.CenterPoint;
        const radiusInMeter = geoQueryRequest.RadiusInMeter;
        const centerLatLng = nodes2ts_1.S2LatLng.fromDegrees(centerPoint.latitude, centerPoint.longitude);
        const latReferenceUnit = centerPoint.latitude > 0.0 ? -1.0 : 1.0;
        const latReferenceLatLng = nodes2ts_1.S2LatLng.fromDegrees(centerPoint.latitude + latReferenceUnit, centerPoint.longitude);
        const lngReferenceUnit = centerPoint.longitude > 0.0 ? -1.0 : 1.0;
        const lngReferenceLatLng = nodes2ts_1.S2LatLng.fromDegrees(centerPoint.latitude, centerPoint.longitude + lngReferenceUnit);
        const latForRadius = radiusInMeter / centerLatLng.getEarthDistance(latReferenceLatLng);
        const lngForRadius = radiusInMeter / centerLatLng.getEarthDistance(lngReferenceLatLng);
        const minLatLng = nodes2ts_1.S2LatLng.fromDegrees(centerPoint.latitude - latForRadius, centerPoint.longitude - lngForRadius);
        const maxLatLng = nodes2ts_1.S2LatLng.fromDegrees(centerPoint.latitude + latForRadius, centerPoint.longitude + lngForRadius);
        return nodes2ts_1.S2LatLngRect.fromLatLng(minLatLng, maxLatLng);
    }
}
exports.S2Util = S2Util;
