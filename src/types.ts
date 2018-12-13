import {
  QueryCommandInput,
  QueryCommandOutput,
  DeleteCommandOutput,
  BatchWriteCommandOutput,
  DeleteCommandInput,
  GetCommandInput,
  GetCommandOutput,
  PutCommandInput,
  PutCommandOutput,
  UpdateCommandInput,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { NativeAttributeValue } from "@aws-sdk/util-dynamodb";

export interface BatchWritePointOutput extends BatchWriteCommandOutput {}

export interface DeletePointInput {
  RangeKeyValue: NativeAttributeValue;
  GeoPoint: GeoPoint;
  DeleteItemInput?: DeleteCommandInput;
}
export interface DeletePointOutput extends DeleteCommandOutput {}
export interface GeoPoint {
  latitude: number;
  longitude: number;
}
export interface GeoQueryInput {
  QueryInput?: QueryCommandInput;
}
export interface GeoQueryOutput extends QueryCommandOutput {}
export interface GetPointInput {
  RangeKeyValue: NativeAttributeValue;
  GeoPoint: GeoPoint;
  GetItemInput: GetCommandInput;
}
export interface GetPointOutput extends GetCommandOutput {}
export interface PutPointInput {
  RangeKeyValue: NativeAttributeValue;
  GeoPoint: GeoPoint;
  PutItemInput: Omit<PutCommandInput, "TableName">;
}
export interface PutPointOutput extends PutCommandOutput {}
export interface QueryRadiusInput extends GeoQueryInput {
  RadiusInMeter: number;
  CenterPoint: GeoPoint;
}
export interface QueryRadiusOutput extends GeoQueryOutput {}
export interface QueryRectangleInput extends GeoQueryInput {
  MinPoint: GeoPoint;
  MaxPoint: GeoPoint;
}
export interface QueryRectangleOutput extends GeoQueryOutput {}
export interface UpdatePointInput {
  RangeKeyValue: NativeAttributeValue;
  GeoPoint: GeoPoint;
  UpdateItemInput: UpdateCommandInput;
}
export interface UpdatePointOutput extends UpdateCommandOutput {}
