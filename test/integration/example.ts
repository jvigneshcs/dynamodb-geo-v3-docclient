import * as ddbGeo from "../../src";
import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { expect } from "chai";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

type Capital = {
  country: string;
  capital: string;
  latitude: number;
  longitude: number;
};

describe("Example", function () {
  // Use a local DB for the example.
  const ddb = new DynamoDBClient({ endpoint: "http://127.0.0.1:8000" });
  const ddbDocumentClient = DynamoDBDocumentClient.from(ddb);

  // Configuration for a new instance of a GeoDataManager. Each GeoDataManager instance represents a table
  const config = new ddbGeo.GeoDataManagerConfiguration(
    ddbDocumentClient,
    "test-capitals"
  );

  // Instantiate the table manager
  const capitalsManager = new ddbGeo.GeoDataManager(config);

  before(async function () {
    this.timeout(20000);
    config.hashKeyLength = 3;
    config.consistentRead = true;

    // Use GeoTableUtil to help construct a CreateTableInput.
    const createTableInput = ddbGeo.GeoTableUtil.getCreateTableRequest(config);
    createTableInput.ProvisionedThroughput;
    const createTableCommand = new CreateTableCommand(createTableInput);
    await ddb.send(createTableCommand);
    // Wait for it to become ready
    await waitUntilTableExists(
      { client: ddb, maxWaitTime: 30000 },
      { TableName: config.tableName }
    );
    // Load sample data in batches

    console.dir("Loading sample data from capitals.json");
    const data = require("../../example/capitals.json");
    const putPointInputs = data.map(function (capital, i) {
      return {
        RangeKeyValue: i.toString(10), // Use this to ensure uniqueness of the hash/range pairs.
        GeoPoint: {
          latitude: capital.latitude,
          longitude: capital.longitude,
        },
        PutItemInput: {
          Item: {
            country: capital.country,
            capital: capital.capital,
          },
        },
      };
    });

    const BATCH_SIZE = 25;
    const WAIT_BETWEEN_BATCHES_MS = 1000;
    let currentBatch = 1;

    async function resumeWriting() {
      if (putPointInputs.length === 0) {
        console.log("Finished loading");
        return;
      }
      const thisBatch = [];
      for (
        var i = 0, itemToAdd = null;
        i < BATCH_SIZE && (itemToAdd = putPointInputs.shift());
        i++
      ) {
        thisBatch.push(itemToAdd);
      }
      console.log(
        "Writing batch " +
          currentBatch++ +
          "/" +
          Math.ceil(data.length / BATCH_SIZE)
      );
      await capitalsManager.batchWritePoints(thisBatch);
      // Insert a single point
      await capitalsManager.putPoint({
        RangeKeyValue: "1234", // Use this to ensure uniqueness of the hash/range pairs.
        GeoPoint: {
          // An object specifying latitutde and longitude as plain numbers. Used to build the geohash, the hashkey and geojson data
          latitude: 47.612780886902755,
          longitude: -122.33806099403246,
        },
        PutItemInput: {
          // Passed through to the underlying DynamoDB.putItem request. TableName is filled in for you.
          Item: {
            // The primary key, geohash and geojson data is filled in for you
            country: "United States", // Specify attribute values using { type: value } objects, like the DynamoDB API.
            capital: "Seattle",
          },
        },
      });
      // Sleep
      await new Promise((resolve) =>
        setInterval(resolve, WAIT_BETWEEN_BATCHES_MS)
      );
      return resumeWriting();
    }
    return resumeWriting();
  });

  it("queryRadius", async function () {
    this.timeout(20000);
    // Perform a radius query
    const result = await capitalsManager.queryRadius({
      RadiusInMeter: 100000,
      CenterPoint: {
        latitude: 52.22573,
        longitude: 0.149593,
      },
    });
    console.log("The result is");
    console.log(result);
    expect(result).to.deep.equal([
      {
        rangeKey: "50",
        country: "United Kingdom",
        capital: "London",
        hashKey: 522,
        geoJson: '{"type":"Point","coordinates":[-0.13,51.51]}',
        geohash: BigInt("5221366118452580119"),
      },
    ]);
  });

  after(async function () {
    this.timeout(10000);
    const deleteTableCommand = new DeleteTableCommand({
      TableName: config.tableName,
    });
    await ddb.send(deleteTableCommand);
  });
});
