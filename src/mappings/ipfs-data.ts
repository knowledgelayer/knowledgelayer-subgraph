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
import {
  UserDescription,
  PlatformDescription,
  CourseDescription,
  Lesson,
  ReviewDescription,
} from "../../generated/schema";
import { concatenate } from "../utils";

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

  const description = new UserDescription(id);
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

  const description = new PlatformDescription(id);

  description.platform = platformId.toString();
  description.about = getValueAsString(jsonObject, "about");
  description.website = getValueAsString(jsonObject, "website");
  description.video_url = getValueAsString(jsonObject, "video_url");
  description.image_url = getValueAsString(jsonObject, "image_url");

  description.save();
}

export function handleCourseData(content: Bytes): void {
  const checkJson = json.try_fromBytes(content);
  const jsonObject = checkJson.isOk ? checkJson.value.toObject() : null;

  if (jsonObject === null) {
    log.warning("Error parsing json: {}", [dataSource.stringParam()]);
    return;
  }

  const context = dataSource.context();
  const courseId = context.getBigInt("courseId");
  const id = context.getString("id");
  const timestamp = context.getString("timestamp");

  let description = new CourseDescription(id);
  description.course = courseId.toString();

  // Non-mandatory (nullable) fields assigned below
  description.title = getValueAsString(jsonObject, "title");
  description.about = getValueAsString(jsonObject, "about");
  description.image_url = getValueAsString(jsonObject, "image_url");

  const keywords = getValueAsArray(jsonObject, "keywords");
  if (keywords) {
    description.keywords = toStringArray(keywords);
    description.keywords_raw = keywords.join(",");
  } else {
    description.keywords = [];
    description.keywords_raw = "";
  }

  // Creates duplicate values. Open issue
  // https://github.com/graphprotocol/graph-node/issues/4087
  // description.keywords = createKeywordEntities(description.keywords_raw!)!;

  const lessons = getValueAsArray(jsonObject, "lessons");

  if (lessons) {
    for (let i = 0; i < lessons.length; i++) {
      const lessonId = concatenate(courseId.toString(), i.toString()) + "-" + timestamp;
      const lessonData = lessons[i].toObject();

      const lesson = new Lesson(lessonId);
      lesson.course = id;
      lesson.title = getValueAsString(lessonData, "title");
      lesson.about = getValueAsString(lessonData, "about");
      lesson.videoPlaybackId = getValueAsString(lessonData, "videoPlaybackId");
      lesson.save();
    }
  }

  description.save();
}

export function handleReviewData(content: Bytes): void {
  const checkJson = json.try_fromBytes(content);
  const jsonObject = checkJson.isOk ? checkJson.value.toObject() : null;

  if (jsonObject === null) {
    log.warning("Error parsing json: {}", [dataSource.stringParam()]);
    return;
  }

  const context = dataSource.context();
  const reviewId = context.getString("reviewId");
  const id = context.getString("id");

  let description = new ReviewDescription(id);
  description.review = reviewId;
  description.content = getValueAsString(jsonObject, "content");

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

function getValueAsArray(jsonObject: TypedMap<string, JSONValue>, key: string): JSONValue[] | null {
  const value = jsonObject.get(key);

  if (value == null || value.isNull() || value.kind != JSONValueKind.ARRAY) {
    return null;
  }

  return value.toArray();
}

// Transforms a comma separated string of keywords into an Array of Keyword.id entities.
function createKeywordEntities(keywords: string): string[] | null {
  const _keywords = keywords.split(",");

  // To avoid returning an empty list, which is not allowed according to the schema.
  if (_keywords.length == 0) {
    return null;
  }

  // Initialize an array with length of number of keywords
  let keywordArray: string[] = [];

  // Create keyword entities and add to array
  // for (let i = 0; i < _keywords.length; i++) {
  // Removes whitespace at beginning and end. Needed because of keywords.split(",").
  // let text = _keywords[i].trim();
  // Will generate duplicates. Open subgraph issues https://github.com/graphprotocol/graph-node/issues/4087
  // and error: error: store error: conflicting key value violates exclusion constraint "keyword_id_block_range_excl"
  // let keyword = getOrCreateKeyword(text)
  // keywordArray.push(keyword.id)
  // }

  return keywordArray;
}

function toStringArray(arr: JSONValue[]): string[] {
  const result: string[] = new Array<string>(arr.length);

  for (let i = 0; i < arr.length; i++) {
    result[i] = arr[i].toString();
  }

  return result;
}
