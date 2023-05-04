import { store, DataSourceContext } from "@graphprotocol/graph-ts";
// import { ServiceData, ProposalData } from "../../generated/templates";
import {
  CourseCreated,
  CourseUpdated,
} from "../../generated/KnowledgeLayerCourse/KnowledgeLayerCourse";
import { getOrCreateCourse, getOrCreatePlatform, getOrCreateUser } from "../getters";

export function handleCourseCreated(event: CourseCreated): void {
  const course = getOrCreateCourse(event.params.courseId);
  course.createdAt = event.block.timestamp;
  course.updatedAt = event.block.timestamp;
  course.seller = getOrCreateUser(event.params.ownerId).id;
  course.price = event.params.price;
  course.token = event.params.token.toHexString();

  const platform = getOrCreatePlatform(event.params.platformId);
  course.platform = platform.id;

  const dataId = event.params.dataUri + "-" + event.block.timestamp.toString();
  course.cid = event.params.dataUri;
  course.description = dataId;

  const context = new DataSourceContext();
  context.setBigInt("courseId", event.params.courseId);
  context.setString("id", dataId);
  // CourseData.createWithContext(event.params.dataUri, context);

  course.save();
}

export function handleCourseUpdated(event: CourseUpdated): void {
  const courseId = event.params.courseId;
  const course = getOrCreateCourse(courseId);
  course.updatedAt = event.block.timestamp;

  const oldCid = course.cid;
  const newCid = event.params.dataUri;
  const dataId = newCid + "-" + event.block.timestamp.toString();
  course.description = dataId;
  course.cid = newCid;

  const context = new DataSourceContext();
  context.setBigInt("serviceId", courseId);
  context.setString("id", dataId);

  if (oldCid) {
    store.remove("ServiceDescription", oldCid);
  }

  // CourseData.createWithContext(newCid, context);

  course.save();
}