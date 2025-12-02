"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S2Util = void 0;
const s2js_1 = require("s2js");
const { LatLng: S2LatLng, Rect: S2LatLngRect } = s2js_1.s2;
// Earth radius in meters (s2js distance() returns radians)
const EARTH_RADIUS_METERS = 6371000;
class S2Util {
    static latLngRectFromQueryRectangleInput(geoQueryRequest) {
        const queryRectangleRequest = geoQueryRequest;
        const minPoint = queryRectangleRequest.MinPoint;
        const maxPoint = queryRectangleRequest.MaxPoint;
        let latLngRect = null;
        if (minPoint != null && maxPoint != null) {
            const minLatLng = S2LatLng.fromDegrees(minPoint.latitude, minPoint.longitude);
            const maxLatLng = S2LatLng.fromDegrees(maxPoint.latitude, maxPoint.longitude);
            // s2js: lat and lng are already in radians
            const latInterval = new s2js_1.r1.Interval(minLatLng.lat, maxLatLng.lat);
            const lngInterval = new s2js_1.s1.Interval(minLatLng.lng, maxLatLng.lng);
            latLngRect = new S2LatLngRect(latInterval, lngInterval);
        }
        return latLngRect;
    }
    static getBoundingLatLngRectFromQueryRadiusInput(geoQueryRequest) {
        const centerPoint = geoQueryRequest.CenterPoint;
        const radiusInMeter = geoQueryRequest.RadiusInMeter;
        const centerLatLng = S2LatLng.fromDegrees(centerPoint.latitude, centerPoint.longitude);
        const latReferenceUnit = centerPoint.latitude > 0.0 ? -1.0 : 1.0;
        const latReferenceLatLng = S2LatLng.fromDegrees(centerPoint.latitude + latReferenceUnit, centerPoint.longitude);
        const lngReferenceUnit = centerPoint.longitude > 0.0 ? -1.0 : 1.0;
        const lngReferenceLatLng = S2LatLng.fromDegrees(centerPoint.latitude, centerPoint.longitude + lngReferenceUnit);
        const latForRadius = radiusInMeter / (centerLatLng.distance(latReferenceLatLng) * EARTH_RADIUS_METERS);
        const lngForRadius = radiusInMeter / (centerLatLng.distance(lngReferenceLatLng) * EARTH_RADIUS_METERS);
        const minLatLng = S2LatLng.fromDegrees(centerPoint.latitude - latForRadius, centerPoint.longitude - lngForRadius);
        const maxLatLng = S2LatLng.fromDegrees(centerPoint.latitude + latForRadius, centerPoint.longitude + lngForRadius);
        const latInterval = new s2js_1.r1.Interval(minLatLng.lat, maxLatLng.lat);
        const lngInterval = new s2js_1.s1.Interval(minLatLng.lng, maxLatLng.lng);
        return new S2LatLngRect(latInterval, lngInterval);
    }
}
exports.S2Util = S2Util;
