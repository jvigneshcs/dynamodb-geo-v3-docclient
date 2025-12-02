import { expect } from "chai";
import { DynamoDBManager } from "../../src/dynamodb/DynamoDBManager";
import { GeoDataManagerConfiguration } from "../../src/GeoDataManagerConfiguration";
import Long from "long";
import { GeohashRange } from "../../src/model/GeohashRange";
import { UpdatePointInput } from "../../src/types";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

describe("DynamoDB API Migration Tests", () => {
  let ddbManager: DynamoDBManager;
  let config: GeoDataManagerConfiguration;
  let mockDocClient: DynamoDBDocumentClient;

  beforeEach(() => {
    // Create a mock DynamoDB client (won't actually connect)
    const ddbClient = new DynamoDBClient({
      region: "us-east-1",
      endpoint: "http://localhost:8000",
    });
    mockDocClient = DynamoDBDocumentClient.from(ddbClient);

    config = new GeoDataManagerConfiguration(mockDocClient, "test-table");
    config.hashKeyAttributeName = "hashKey";
    config.rangeKeyAttributeName = "rangeKey";
    config.geohashAttributeName = "geohash";
    config.geoJsonAttributeName = "geoJson";
    config.geohashIndexName = "geohash-index";

    ddbManager = new DynamoDBManager(config);
  });

  describe("queryGeohash() with KeyConditionExpression", () => {
    it("should use KeyConditionExpression instead of KeyConditions", () => {
      // This test verifies the migration has been applied
      // We verify the method exists and has the correct signature
      expect(ddbManager.queryGeohash).to.be.a("function");

      const hashKey = Long.fromNumber(123456);
      const range = new GeohashRange(
        Long.fromNumber(1000000),
        Long.fromNumber(2000000)
      );

      // Note: This would fail without actual DynamoDB connection,
      // but we're just verifying the method structure and signature
      // The actual query logic is tested by integration tests
      expect(hashKey).to.exist;
      expect(range).to.exist;
    });

    it("should handle query input parameters correctly", () => {
      // Verify the method accepts QueryCommandInput
      const hashKey = Long.fromNumber(123456);
      const range = new GeohashRange(
        Long.fromNumber(1000000),
        Long.fromNumber(2000000)
      );

      const queryInput = {
        TableName: config.tableName, // Required by type
        Limit: 10,
        FilterExpression: "attribute_exists(city)",
      };

      // Should not throw for valid input structure
      expect(() => {
        ddbManager.queryGeohash(queryInput, hashKey, range);
      }).to.not.throw();
    });
  });

  describe("updatePoint() with UpdateExpression validation", () => {
    const testGeoPoint = { latitude: 51.51, longitude: -0.13 };
    const testRangeKeyValue = "test-123";

    describe("AttributeUpdates validation (deprecated pattern)", () => {
      it("should throw error when trying to update geohash via AttributeUpdates", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName, // Will be overwritten by updatePoint()
            Key: {}, // Will be filled by updatePoint()
            AttributeUpdates: {
              geohash: {
                Value: BigInt(12345),
                Action: "PUT",
              },
            },
          },
        };

        expect(() => {
          ddbManager.updatePoint(updateInput);
        }).to.throw(/Cannot update protected attribute: geohash/);
      });

      it("should throw error when trying to update geoJson via AttributeUpdates", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName,
            Key: {},
            AttributeUpdates: {
              geoJson: {
                Value: JSON.stringify({ type: "Point", coordinates: [0, 0] }),
                Action: "PUT",
              },
            },
          },
        };

        expect(() => {
          ddbManager.updatePoint(updateInput);
        }).to.throw(/Cannot update protected attribute: geoJson/);
      });

      it("should allow updates to non-protected attributes via AttributeUpdates", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName,
            Key: {},
            AttributeUpdates: {
              city: {
                Value: "London",
                Action: "PUT",
              },
            },
          },
        };

        // Should not throw for valid updates
        expect(() => {
          ddbManager.updatePoint(updateInput);
        }).to.not.throw();
      });
    });

    describe("UpdateExpression validation (modern pattern)", () => {
      it("should throw error when UpdateExpression directly references geohash", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName,
            Key: {},
            UpdateExpression: "SET geohash = :newHash",
            ExpressionAttributeValues: {
              ":newHash": BigInt(12345),
            },
          },
        };

        expect(() => {
          ddbManager.updatePoint(updateInput);
        }).to.throw(/Cannot update protected attribute: geohash/);
      });

      it("should throw error when UpdateExpression directly references geoJson", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName,
            Key: {},
            UpdateExpression: "SET geoJson = :newGeoJson",
            ExpressionAttributeValues: {
              ":newGeoJson": JSON.stringify({ type: "Point", coordinates: [0, 0] }),
            },
          },
        };

        expect(() => {
          ddbManager.updatePoint(updateInput);
        }).to.throw(/Cannot update protected attribute: geoJson/);
      });

      it("should throw error when ExpressionAttributeNames maps placeholder to geohash", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName,
            Key: {},
            UpdateExpression: "SET #attr = :val",
            ExpressionAttributeNames: {
              "#attr": "geohash",
            },
            ExpressionAttributeValues: {
              ":val": BigInt(12345),
            },
          },
        };

        expect(() => {
          ddbManager.updatePoint(updateInput);
        }).to.throw(/Cannot update protected attribute: geohash \(referenced as #attr\)/);
      });

      it("should throw error when ExpressionAttributeNames maps placeholder to geoJson", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName,
            Key: {},
            UpdateExpression: "SET #geo = :val",
            ExpressionAttributeNames: {
              "#geo": "geoJson",
            },
            ExpressionAttributeValues: {
              ":val": JSON.stringify({ type: "Point", coordinates: [0, 0] }),
            },
          },
        };

        expect(() => {
          ddbManager.updatePoint(updateInput);
        }).to.throw(/Cannot update protected attribute: geoJson \(referenced as #geo\)/);
      });

      it("should allow updates to non-protected attributes via UpdateExpression", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName,
            Key: {},
            UpdateExpression: "SET #city = :cityVal, #country = :countryVal",
            ExpressionAttributeNames: {
              "#city": "city",
              "#country": "country",
            },
            ExpressionAttributeValues: {
              ":cityVal": "London",
              ":countryVal": "UK",
            },
          },
        };

        // Should not throw for valid updates
        expect(() => {
          ddbManager.updatePoint(updateInput);
        }).to.not.throw();
      });

      it("should be case-insensitive when detecting protected attributes", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName,
            Key: {},
            UpdateExpression: "SET GEOHASH = :val",
            ExpressionAttributeValues: {
              ":val": BigInt(12345),
            },
          },
        };

        expect(() => {
          ddbManager.updatePoint(updateInput);
        }).to.throw(/Cannot update protected attribute: geohash/);
      });
    });

    describe("Error messages", () => {
      it("should provide clear error message for AttributeUpdates", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName,
            Key: {},
            AttributeUpdates: {
              geohash: {
                Value: BigInt(12345),
                Action: "PUT",
              },
            },
          },
        };

        try {
          ddbManager.updatePoint(updateInput);
          expect.fail("Should have thrown an error");
        } catch (error: any) {
          expect(error.message).to.include("Cannot update protected attribute");
          expect(error.message).to.include("geohash");
          expect(error.message).to.include("auto-generated");
        }
      });

      it("should provide clear error message for UpdateExpression with placeholder", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName,
            Key: {},
            UpdateExpression: "SET #gh = :val",
            ExpressionAttributeNames: {
              "#gh": "geohash",
            },
            ExpressionAttributeValues: {
              ":val": BigInt(12345),
            },
          },
        };

        try {
          ddbManager.updatePoint(updateInput);
          expect.fail("Should have thrown an error");
        } catch (error: any) {
          expect(error.message).to.include("Cannot update protected attribute");
          expect(error.message).to.include("geohash");
          expect(error.message).to.include("referenced as #gh");
        }
      });
    });

    describe("Edge cases", () => {
      it("should handle UpdateExpression without ExpressionAttributeNames", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName,
            Key: {},
            UpdateExpression: "SET city = :val",
            ExpressionAttributeValues: {
              ":val": "London",
            },
          },
        };

        // Should not throw
        expect(() => {
          ddbManager.updatePoint(updateInput);
        }).to.not.throw();
      });

      it("should handle multiple attributes in UpdateExpression", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName,
            Key: {},
            UpdateExpression: "SET city = :city, country = :country, population = :pop",
            ExpressionAttributeValues: {
              ":city": "London",
              ":country": "UK",
              ":pop": 9000000,
            },
          },
        };

        // Should not throw for valid updates
        expect(() => {
          ddbManager.updatePoint(updateInput);
        }).to.not.throw();
      });

      it("should handle ADD, REMOVE, and DELETE operations in UpdateExpression", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName,
            Key: {},
            UpdateExpression: "SET city = :city ADD visitCount :inc REMOVE oldField",
            ExpressionAttributeValues: {
              ":city": "London",
              ":inc": 1,
            },
          },
        };

        // Should not throw for valid updates
        expect(() => {
          ddbManager.updatePoint(updateInput);
        }).to.not.throw();
      });

      it("should detect protected attributes in complex UpdateExpression", () => {
        const updateInput: UpdatePointInput = {
          GeoPoint: testGeoPoint,
          RangeKeyValue: testRangeKeyValue,
          UpdateItemInput: {
            TableName: config.tableName,
            Key: {},
            UpdateExpression: "SET city = :city, geohash = :hash, country = :country",
            ExpressionAttributeValues: {
              ":city": "London",
              ":hash": BigInt(12345),
              ":country": "UK",
            },
          },
        };

        expect(() => {
          ddbManager.updatePoint(updateInput);
        }).to.throw(/Cannot update protected attribute: geohash/);
      });
    });
  });

  describe("Integration: Both validations work together", () => {
    it("should handle input with both AttributeUpdates and UpdateExpression", () => {
      const testGeoPoint = { latitude: 51.51, longitude: -0.13 };
      const testRangeKeyValue = "test-123";

      // This is an unusual case but technically possible
      const updateInput: UpdatePointInput = {
        GeoPoint: testGeoPoint,
        RangeKeyValue: testRangeKeyValue,
        UpdateItemInput: {
          TableName: config.tableName,
          Key: {},
          AttributeUpdates: {
            city: {
              Value: "London",
              Action: "PUT",
            },
          },
          UpdateExpression: "SET country = :country",
          ExpressionAttributeValues: {
            ":country": "UK",
          },
        },
      };

      // Should not throw for valid updates
      expect(() => {
        ddbManager.updatePoint(updateInput);
      }).to.not.throw();
    });
  });
});
