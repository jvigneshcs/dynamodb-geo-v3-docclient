import { S2Manager } from "../../src/s2/S2Manager";
import { expect } from "chai";
import Long from "long";

describe("S2 Migration (nodes2ts -> s2js)", () => {
  describe("S2Manager.generateGeohash", () => {
    it("should generate correct geohash for London coordinates", () => {
      const geohash = S2Manager.generateGeohash({
        latitude: 52.1,
        longitude: 2,
      });
      expect(geohash.toString()).to.equal("5177531549489041509");
    });

    it("should return bigint type", () => {
      const geohash = S2Manager.generateGeohash({
        latitude: 52.1,
        longitude: 2,
      });
      expect(typeof geohash).to.equal("bigint");
    });

    it("should generate different geohashes for different locations", () => {
      const geohash1 = S2Manager.generateGeohash({
        latitude: 52.1,
        longitude: 2,
      });
      const geohash2 = S2Manager.generateGeohash({
        latitude: 51.5,
        longitude: -0.1,
      });
      expect(geohash1.toString()).to.not.equal(geohash2.toString());
    });
  });

  describe("S2Manager.generateHashKey", () => {
    it("should generate correct hash key with length 6", () => {
      const geohashLong = Long.fromString("5177531549489041509", false, 10);
      const hashKey = S2Manager.generateHashKey(geohashLong, 6);
      expect(hashKey.toNumber()).to.equal(517753);
    });

    it("should handle different hash key lengths", () => {
      const geohashLong = Long.fromString("5177531549489041509", false, 10);
      
      const hashKey3 = S2Manager.generateHashKey(geohashLong, 3);
      expect(hashKey3.toNumber()).to.equal(517);

      const hashKey5 = S2Manager.generateHashKey(geohashLong, 5);
      expect(hashKey5.toNumber()).to.equal(51775);

      const hashKey6 = S2Manager.generateHashKey(geohashLong, 6);
      expect(hashKey6.toNumber()).to.equal(517753);
    });

    it("should handle negative geohash values", () => {
      const negativeGeohash = Long.fromString("-1234567890123456789", true, 10);
      const hashKey = S2Manager.generateHashKey(negativeGeohash, 6);
      // Should handle the negative sign correctly
      expect(hashKey.toString()).to.match(/^-?\d+$/);
    });
  });

  describe("Integration: geohash to hashKey conversion", () => {
    it("should convert geohash to Long and generate correct hash key", () => {
      // Generate geohash as bigint
      const geohash = S2Manager.generateGeohash({
        latitude: 52.1,
        longitude: 2,
      });

      // Convert to Long (as done in DynamoDBManager)
      const geohashLong = Long.fromString(geohash.toString(), false, 10);

      // Generate hash key
      const hashKey = S2Manager.generateHashKey(geohashLong, 6);

      expect(hashKey.toNumber()).to.equal(517753);
    });

    it("should handle complete workflow for multiple coordinates", () => {
      const testCases = [
        { lat: 52.1, lng: 2.0, expectedHashKey6: 517753 },
        { lat: 51.5, lng: -0.1, expectedHashKey6: 486390 },
        { lat: 40.7, lng: -74.0, expectedHashKey6: 964490 },
      ];

      testCases.forEach((testCase) => {
        const geohash = S2Manager.generateGeohash({
          latitude: testCase.lat,
          longitude: testCase.lng,
        });
        const geohashLong = Long.fromString(geohash.toString(), false, 10);
        const hashKey = S2Manager.generateHashKey(geohashLong, 6);
        
        expect(hashKey.toNumber()).to.equal(testCase.expectedHashKey6);
      });
    });
  });

  describe("S2JS API Compatibility", () => {
    it("should handle extreme latitude values", () => {
      const northPole = S2Manager.generateGeohash({
        latitude: 90,
        longitude: 0,
      });
      const southPole = S2Manager.generateGeohash({
        latitude: -90,
        longitude: 0,
      });

      expect(typeof northPole).to.equal("bigint");
      expect(typeof southPole).to.equal("bigint");
      expect(northPole.toString()).to.not.equal(southPole.toString());
    });

    it("should handle date line crossing (longitude ±180)", () => {
      const east = S2Manager.generateGeohash({
        latitude: 0,
        longitude: 179.9,
      });
      const west = S2Manager.generateGeohash({
        latitude: 0,
        longitude: -179.9,
      });

      expect(typeof east).to.equal("bigint");
      expect(typeof west).to.equal("bigint");
    });

    it("should generate consistent geohashes for same coordinates", () => {
      const geohash1 = S2Manager.generateGeohash({
        latitude: 52.1,
        longitude: 2,
      });
      const geohash2 = S2Manager.generateGeohash({
        latitude: 52.1,
        longitude: 2,
      });

      expect(geohash1.toString()).to.equal(geohash2.toString());
    });
  });
});
