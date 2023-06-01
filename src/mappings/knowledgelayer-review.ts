import { DataSourceContext } from "@graphprotocol/graph-ts";
import { Course, User } from "../../generated/schema";
import { Mint } from "../../generated/KnowledgeLayerReview/KnowledgeLayerReview";
import { getOrCreateReview } from "../getters";
import { ONE } from "../constants";
import { ReviewData } from "../../generated/templates";
import { concatenate } from "../utils";

export function handleMint(event: Mint): void {
  const review = getOrCreateReview(
    event.params.id,
    event.params.courseId,
    event.params.toId,
    event.params.fromId,
  );
  review.rating = event.params.rating;
  review.createdAt = event.block.timestamp;
  review.cid = event.params.dataUri;

  // Update user average rating
  const user = User.load(event.params.toId.toString());
  if (!user) return;
  const userRating = user.rating
    .times(user.numReviews.toBigDecimal())
    .plus(event.params.rating.toBigDecimal())
    .div(user.numReviews.plus(ONE).toBigDecimal());
  user.rating = userRating;
  user.numReviews = user.numReviews.plus(ONE);
  user.save();

  // Update course average rating
  const course = Course.load(event.params.courseId.toString());
  if (!course) return;
  const courseRating = course.rating
    .times(course.numReviews.toBigDecimal())
    .plus(event.params.rating.toBigDecimal())
    .div(course.numReviews.plus(ONE).toBigDecimal());
  course.rating = courseRating;
  course.numReviews = course.numReviews.plus(ONE);
  course.save();

  const cid = event.params.dataUri;
  const dataId = concatenate(cid, event.block.timestamp.toString());
  const context = new DataSourceContext();
  context.setString("reviewId", review.id);
  context.setString("id", dataId);

  ReviewData.createWithContext(cid, context);

  review.description = dataId;
  review.save();
}
