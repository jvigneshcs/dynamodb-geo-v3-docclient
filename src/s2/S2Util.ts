import { QueryRadiusInput, QueryRectangleInput } from "../types";
import { s2, r1, s1 } from "s2js";
const { LatLng: S2LatLng, Rect: S2LatLngRect } = s2;

// s2js Rect type
type Rect = InstanceType<typeof S2LatLngRect>;

// Earth radius in meters (s2js distance() returns radians)
const EARTH_RADIUS_METERS = 6371000;

export class S2Util {
  public static latLngRectFromQueryRectangleInput(
    geoQueryRequest: QueryRectangleInput
  ): Rect {
    const queryRectangleRequest = geoQueryRequest as QueryRectangleInput;

    const minPoint = queryRectangleRequest.MinPoint;
    const maxPoint = queryRectangleRequest.MaxPoint;

    let latLngRect: Rect = null;

    if (minPoint != null && maxPoint != null) {
      const minLatLng = S2LatLng.fromDegrees(
        minPoint.latitude,
        minPoint.longitude
      );
      const maxLatLng = S2LatLng.fromDegrees(
        maxPoint.latitude,
        maxPoint.longitude
      );

      // s2js: lat and lng are already in radians
      const latInterval = new r1.Interval(minLatLng.lat, maxLatLng.lat);
      const lngInterval = new s1.Interval(minLatLng.lng, maxLatLng.lng);
      latLngRect = new S2LatLngRect(latInterval, lngInterval);
    }

    return latLngRect;
  }

  public static getBoundingLatLngRectFromQueryRadiusInput(
    geoQueryRequest: QueryRadiusInput
  ): Rect {
    const centerPoint = geoQueryRequest.CenterPoint;
    const radiusInMeter = geoQueryRequest.RadiusInMeter;

    const centerLatLng = S2LatLng.fromDegrees(
      centerPoint.latitude,
      centerPoint.longitude
    );

    const latReferenceUnit = centerPoint.latitude > 0.0 ? -1.0 : 1.0;
    const latReferenceLatLng = S2LatLng.fromDegrees(
      centerPoint.latitude + latReferenceUnit,
      centerPoint.longitude
    );
    const lngReferenceUnit = centerPoint.longitude > 0.0 ? -1.0 : 1.0;
    const lngReferenceLatLng = S2LatLng.fromDegrees(
      centerPoint.latitude,
      centerPoint.longitude + lngReferenceUnit
    );

    const latForRadius =
      radiusInMeter / (centerLatLng.distance(latReferenceLatLng) * EARTH_RADIUS_METERS);
    const lngForRadius =
      radiusInMeter / (centerLatLng.distance(lngReferenceLatLng) * EARTH_RADIUS_METERS);

    const minLatLng = S2LatLng.fromDegrees(
      centerPoint.latitude - latForRadius,
      centerPoint.longitude - lngForRadius
    );
    const maxLatLng = S2LatLng.fromDegrees(
      centerPoint.latitude + latForRadius,
      centerPoint.longitude + lngForRadius
    );

    const latInterval = new r1.Interval(minLatLng.lat, maxLatLng.lat);
    const lngInterval = new s1.Interval(minLatLng.lng, maxLatLng.lng);
    return new S2LatLngRect(latInterval, lngInterval);
  }
}
