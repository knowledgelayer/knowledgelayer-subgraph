import {
  json,
  JSONValue,
  JSONValueKind,
  BigInt,
  TypedMap,
  Bytes,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";
import { UserDescription, PlatformDescription } from "../../generated/schema";

export function handleUserData(content: Bytes): void {
  const checkJson = json.try_fromBytes(content);
  const jsonObject = checkJson.isOk ? checkJson.value.toObject() : null;

  if (jsonObject === null) {
    log.warning("Error parsing json: {}", [dataSource.stringParam()]);
    return;
  }

  const context = dataSource.context();
  const userId = context.getBigInt("userId");
  const id = context.getString("id");

  let description = new UserDescription(id);
  description.user = userId.toString();

  description.title = getValueAsString(jsonObject, "title");
  description.about = getValueAsString(jsonObject, "about");
  description.timezone = getValueAsBigInt(jsonObject, "timezone");
  description.headline = getValueAsString(jsonObject, "headline");
  description.country = getValueAsString(jsonObject, "country");
  description.role = getValueAsString(jsonObject, "role");
  description.name = getValueAsString(jsonObject, "name");
  description.video_url = getValueAsString(jsonObject, "video_url");
  description.image_url = getValueAsString(jsonObject, "image_url");

  description.save();
}

export function handlePlatformData(content: Bytes): void {
  const checkJson = json.try_fromBytes(content);
  const jsonObject = checkJson.isOk ? checkJson.value.toObject() : null;

  if (jsonObject === null) {
    log.warning("Error parsing json: {}", [dataSource.stringParam()]);
    return;
  }

  const context = dataSource.context();
  const platformId = context.getBigInt("platformId");
  const id = context.getString("id");

  let description = new PlatformDescription(id);

  description.platform = platformId.toString();
  description.about = getValueAsString(jsonObject, "about");
  description.website = getValueAsString(jsonObject, "website");
  description.video_url = getValueAsString(jsonObject, "video_url");
  description.image_url = getValueAsString(jsonObject, "image_url");

  description.save();
}

//==================================== Help functions ===========================================

function getValueAsString(jsonObject: TypedMap<string, JSONValue>, key: string): string | null {
  const value = jsonObject.get(key);

  if (value == null || value.isNull() || value.kind != JSONValueKind.STRING) {
    return null;
  }

  return value.toString();
}

function getValueAsBigInt(jsonObject: TypedMap<string, JSONValue>, key: string): BigInt | null {
  const value = jsonObject.get(key);

  if (value == null || value.isNull() || value.kind != JSONValueKind.NUMBER) {
    return null;
  }

  return value.toBigInt();
}
