"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBManager = void 0;
const S2Manager_1 = require("../s2/S2Manager");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
class DynamoDBManager {
    config;
    constructor(config) {
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
    async queryGeohash(queryInput, hashKey, range) {
        const queryOutputs = [];
        const nextQuery = async (lastEvaluatedKey = null) => {
            const keyConditions = {};
            keyConditions[this.config.hashKeyAttributeName] = {
                ComparisonOperator: "EQ",
                AttributeValueList: [parseFloat(hashKey.toString(10))],
            };
            const minRange = BigInt(range.rangeMin.toString(10));
            const maxRange = BigInt(range.rangeMax.toString(10));
            keyConditions[this.config.geohashAttributeName] = {
                ComparisonOperator: "BETWEEN",
                AttributeValueList: [minRange, maxRange],
            };
            const defaults = {
                TableName: this.config.tableName,
                KeyConditions: keyConditions,
                IndexName: this.config.geohashIndexName,
                ConsistentRead: this.config.consistentRead,
                ReturnConsumedCapacity: "TOTAL",
                ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey }),
            };
            const queryCommand = new lib_dynamodb_1.QueryCommand({ ...defaults, ...queryInput });
            const queryOutput = await this.config.documentClient.send(queryCommand);
            queryOutputs.push(queryOutput);
            if (queryOutput.LastEvaluatedKey) {
                return nextQuery(queryOutput.LastEvaluatedKey);
            }
        };
        await nextQuery();
        return queryOutputs;
    }
    getPoint(getPointInput) {
        const geohash = S2Manager_1.S2Manager.generateGeohash(getPointInput.GeoPoint);
        const hashKey = S2Manager_1.S2Manager.generateHashKey(geohash, this.config.hashKeyLength);
        const getItemInput = getPointInput.GetItemInput;
        getItemInput.TableName = this.config.tableName;
        getItemInput.Key = {
            [this.config.hashKeyAttributeName]: parseFloat(hashKey.toString(10)),
            [this.config.rangeKeyAttributeName]: getPointInput.RangeKeyValue,
        };
        const getCommand = new lib_dynamodb_1.GetCommand(getItemInput);
        return this.config.documentClient.send(getCommand);
    }
    putPoint(putPointInput) {
        const geohash = S2Manager_1.S2Manager.generateGeohash(putPointInput.GeoPoint);
        const hashKey = S2Manager_1.S2Manager.generateHashKey(geohash, this.config.hashKeyLength);
        const putItemInput = {
            ...putPointInput.PutItemInput,
            TableName: this.config.tableName,
            Item: putPointInput.PutItemInput.Item || {},
        };
        putItemInput.Item[this.config.hashKeyAttributeName] = parseFloat(hashKey.toString(10));
        putItemInput.Item[this.config.rangeKeyAttributeName] =
            putPointInput.RangeKeyValue;
        putItemInput.Item[this.config.geohashAttributeName] = BigInt(geohash.toString(10));
        putItemInput.Item[this.config.geoJsonAttributeName] = JSON.stringify({
            type: this.config.geoJsonPointType,
            coordinates: this.config.longitudeFirst
                ? [putPointInput.GeoPoint.longitude, putPointInput.GeoPoint.latitude]
                : [putPointInput.GeoPoint.latitude, putPointInput.GeoPoint.longitude],
        });
        const putCommand = new lib_dynamodb_1.PutCommand(putItemInput);
        return this.config.documentClient.send(putCommand);
    }
    batchWritePoints(putPointInputs) {
        const writeInputs = [];
        putPointInputs.forEach((putPointInput) => {
            const geohash = S2Manager_1.S2Manager.generateGeohash(putPointInput.GeoPoint);
            const hashKey = S2Manager_1.S2Manager.generateHashKey(geohash, this.config.hashKeyLength);
            const putItemInput = putPointInput.PutItemInput;
            const putRequest = {
                Item: putItemInput.Item || {},
            };
            putRequest.Item[this.config.hashKeyAttributeName] = parseFloat(hashKey.toString(10));
            putRequest.Item[this.config.rangeKeyAttributeName] =
                putPointInput.RangeKeyValue;
            putRequest.Item[this.config.geohashAttributeName] = BigInt(geohash.toString(10));
            putRequest.Item[this.config.geoJsonAttributeName] = JSON.stringify({
                type: this.config.geoJsonPointType,
                coordinates: this.config.longitudeFirst
                    ? [putPointInput.GeoPoint.longitude, putPointInput.GeoPoint.latitude]
                    : [putPointInput.GeoPoint.latitude, putPointInput.GeoPoint.longitude],
            });
            writeInputs.push({ PutRequest: putRequest });
        });
        const batchWriteCommand = new lib_dynamodb_1.BatchWriteCommand({
            RequestItems: {
                [this.config.tableName]: writeInputs,
            },
        });
        return this.config.documentClient.send(batchWriteCommand);
    }
    updatePoint(updatePointInput) {
        const geohash = S2Manager_1.S2Manager.generateGeohash(updatePointInput.GeoPoint);
        const hashKey = S2Manager_1.S2Manager.generateHashKey(geohash, this.config.hashKeyLength);
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
            delete updatePointInput.UpdateItemInput.AttributeUpdates[this.config.geohashAttributeName];
            delete updatePointInput.UpdateItemInput.AttributeUpdates[this.config.geoJsonAttributeName];
        }
        const updateCommand = new lib_dynamodb_1.UpdateCommand(updatePointInput.UpdateItemInput);
        return this.config.documentClient.send(updateCommand);
    }
    deletePoint(deletePointInput) {
        const geohash = S2Manager_1.S2Manager.generateGeohash(deletePointInput.GeoPoint);
        const hashKey = S2Manager_1.S2Manager.generateHashKey(geohash, this.config.hashKeyLength);
        const deleteCommand = new lib_dynamodb_1.DeleteCommand({
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
exports.DynamoDBManager = DynamoDBManager;
