"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoDataManagerConfiguration = void 0;
const nodes2ts_1 = require("nodes2ts");
class GeoDataManagerConfiguration {
    // Public constants
    static MERGE_THRESHOLD = 2;
    // Configuration properties
    tableName;
    consistentRead = false;
    hashKeyAttributeName = "hashKey";
    rangeKeyAttributeName = "rangeKey";
    geohashAttributeName = "geohash";
    geoJsonAttributeName = "geoJson";
    geohashIndexName = "geohash-index";
    hashKeyLength = 2;
    /**
     * The order of the GeoJSON coordinate pair in data.
     * Use false [lat, lon] for compatibility with the Java library https://github.com/awslabs/dynamodb-geo
     * Use true [lon, lat] for GeoJSON standard compliance. (default)
     *
     * Note that this value should match the state of your existing data - if you change it you must update your database manually
     *
     * @type {boolean}
     */
    longitudeFirst = true;
    /**
     * The value of the 'type' attribute in recorded GeoJSON points. Should normally be 'Point', which is standards compliant.
     *
     * Use 'POINT' for compatibility with the Java library https://github.com/awslabs/dynamodb-geo
     *
     * This setting is only relevant for writes. This library doesn't inspect or set this value when reading/querying.
     *
     * @type {string}
     */
    geoJsonPointType = "Point";
    documentClient;
    S2RegionCoverer;
    constructor(documentClient, tableName) {
        this.documentClient = documentClient;
        this.tableName = tableName;
        this.S2RegionCoverer = nodes2ts_1.S2RegionCoverer;
    }
}
exports.GeoDataManagerConfiguration = GeoDataManagerConfiguration;
