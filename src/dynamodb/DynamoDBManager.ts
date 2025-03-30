/*
 * Copyright 2010-2013 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import * as Long from "long";
import { GeoDataManagerConfiguration } from "../GeoDataManagerConfiguration";
import {
  DeletePointInput,
  GetPointInput,
  PutPointInput,
  UpdatePointInput,
} from "../types";
import { S2Manager } from "../s2/S2Manager";
import { GeohashRange } from "../model/GeohashRange";
import {
  QueryCommandInput,
  QueryCommandOutput,
  PutCommandInput,
  GetCommand,
  PutCommand,
  BatchWriteCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { NativeAttributeValue } from "@aws-sdk/util-dynamodb";

export class DynamoDBManager {
  private config: GeoDataManagerConfiguration;

  public constructor(config: GeoDataManagerConfiguration) {
    this.config = config;
  }

  /**
   * Query Amazon DynamoDB
   *
   * @param queryInput
   * @param hashKey
   *            Hash key for the query request.
   *
   * @param range
   *            The range of geohashs to query.
   *
   * @return The query result.
   */
  public async queryGeohash(
    queryInput: QueryCommandInput | undefined,
    hashKey: Long,
    range: GeohashRange
  ) {
    const queryOutputs: QueryCommandOutput[] = [];

    const nextQuery = async (lastEvaluatedKey = null) => {
      const keyConditions: { [key: string]: any } = {};

      keyConditions[this.config.hashKeyAttributeName] = {
        ComparisonOperator: "EQ",
        AttributeValueList: [parseFloat(hashKey.toString(10))],
      };

      const minRange: NativeAttributeValue = BigInt(
        range.rangeMin.toString(10)
      );
      const maxRange: NativeAttributeValue = BigInt(
        range.rangeMax.toString(10)
      );

      keyConditions[this.config.geohashAttributeName] = {
        ComparisonOperator: "BETWEEN",
        AttributeValueList: [minRange, maxRange],
      };

      const defaults = {
        TableName: this.config.tableName,
        KeyConditions: keyConditions,
        IndexName: this.config.geohashIndexName,
        ConsistentRead: this.config.consistentRead,
        ReturnConsumedCapacity: "TOTAL" as const,
        ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey }),
      };
      const queryCommand = new QueryCommand({ ...defaults, ...queryInput });
      const queryOutput = await this.config.documentClient.send(queryCommand);
      queryOutputs.push(queryOutput);
      if (queryOutput.LastEvaluatedKey) {
        return nextQuery(queryOutput.LastEvaluatedKey);
      }
    };

    await nextQuery();
    return queryOutputs;
  }

  public getPoint(getPointInput: GetPointInput) {
    const geohash = S2Manager.generateGeohash(getPointInput.GeoPoint);
    const hashKey = S2Manager.generateHashKey(
      geohash,
      this.config.hashKeyLength
    );

    const getItemInput = getPointInput.GetItemInput;
    getItemInput.TableName = this.config.tableName;

    getItemInput.Key = {
      [this.config.hashKeyAttributeName]: parseFloat(hashKey.toString(10)),
      [this.config.rangeKeyAttributeName]: getPointInput.RangeKeyValue,
    };
    const getCommand = new GetCommand(getItemInput);
    return this.config.documentClient.send(getCommand);
  }

  public putPoint(putPointInput: PutPointInput) {
    const geohash = S2Manager.generateGeohash(putPointInput.GeoPoint);
    const hashKey = S2Manager.generateHashKey(
      geohash,
      this.config.hashKeyLength
    );
    const putItemInput: PutCommandInput = {
      ...putPointInput.PutItemInput,
      TableName: this.config.tableName,
      Item: putPointInput.PutItemInput.Item || {},
    };

    putItemInput.Item[this.config.hashKeyAttributeName] = parseFloat(
      hashKey.toString(10)
    );
    putItemInput.Item[this.config.rangeKeyAttributeName] =
      putPointInput.RangeKeyValue;
    putItemInput.Item[this.config.geohashAttributeName] = BigInt(
      geohash.toString(10)
    );
    putItemInput.Item[this.config.geoJsonAttributeName] = JSON.stringify({
      type: this.config.geoJsonPointType,
      coordinates: this.config.longitudeFirst
        ? [putPointInput.GeoPoint.longitude, putPointInput.GeoPoint.latitude]
        : [putPointInput.GeoPoint.latitude, putPointInput.GeoPoint.longitude],
    });
    const putCommand = new PutCommand(putItemInput);
    return this.config.documentClient.send(putCommand);
  }

  public batchWritePoints(putPointInputs: PutPointInput[]) {
    const writeInputs = [];
    putPointInputs.forEach((putPointInput) => {
      const geohash = S2Manager.generateGeohash(putPointInput.GeoPoint);
      const hashKey = S2Manager.generateHashKey(
        geohash,
        this.config.hashKeyLength
      );
      const putItemInput = putPointInput.PutItemInput;
      const putRequest = {
        Item: putItemInput.Item || {},
      };

      putRequest.Item[this.config.hashKeyAttributeName] = parseFloat(
        hashKey.toString(10)
      );
      putRequest.Item[this.config.rangeKeyAttributeName] =
        putPointInput.RangeKeyValue;
      putRequest.Item[this.config.geohashAttributeName] = BigInt(
        geohash.toString(10)
      );
      putRequest.Item[this.config.geoJsonAttributeName] = JSON.stringify({
        type: this.config.geoJsonPointType,
        coordinates: this.config.longitudeFirst
          ? [putPointInput.GeoPoint.longitude, putPointInput.GeoPoint.latitude]
          : [putPointInput.GeoPoint.latitude, putPointInput.GeoPoint.longitude],
      });
      writeInputs.push({ PutRequest: putRequest });
    });
    const batchWriteCommand = new BatchWriteCommand({
      RequestItems: {
        [this.config.tableName]: writeInputs,
      },
    });
    return this.config.documentClient.send(batchWriteCommand);
  }

  public updatePoint(updatePointInput: UpdatePointInput) {
    const geohash = S2Manager.generateGeohash(updatePointInput.GeoPoint);
    const hashKey = S2Manager.generateHashKey(
      geohash,
      this.config.hashKeyLength
    );

    updatePointInput.UpdateItemInput.TableName = this.config.tableName;

    if (!updatePointInput.UpdateItemInput.Key) {
      updatePointInput.UpdateItemInput.Key = {};
    }

    updatePointInput.UpdateItemInput.Key[this.config.hashKeyAttributeName] =
      parseFloat(hashKey.toString(10));
    updatePointInput.UpdateItemInput.Key[this.config.rangeKeyAttributeName] =
      updatePointInput.RangeKeyValue;

    // Geohash and geoJson cannot be updated.
    if (updatePointInput.UpdateItemInput.AttributeUpdates) {
      delete updatePointInput.UpdateItemInput.AttributeUpdates[
        this.config.geohashAttributeName
      ];
      delete updatePointInput.UpdateItemInput.AttributeUpdates[
        this.config.geoJsonAttributeName
      ];
    }
    const updateCommand = new UpdateCommand(updatePointInput.UpdateItemInput);
    return this.config.documentClient.send(updateCommand);
  }

  public deletePoint(deletePointInput: DeletePointInput) {
    const geohash = S2Manager.generateGeohash(deletePointInput.GeoPoint);
    const hashKey = S2Manager.generateHashKey(
      geohash,
      this.config.hashKeyLength
    );
    const deleteCommand = new DeleteCommand({
      ...deletePointInput.DeleteItemInput,
      TableName: this.config.tableName,
      Key: {
        [this.config.hashKeyAttributeName]: parseFloat(hashKey.toString(10)),
        [this.config.rangeKeyAttributeName]: deletePointInput.RangeKeyValue,
      },
    });
    return this.config.documentClient.send(deleteCommand);
  }
}
