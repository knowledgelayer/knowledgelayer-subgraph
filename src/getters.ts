import { BigInt } from "@graphprotocol/graph-ts";
import { User } from "../generated/schema";
import { ZERO, ZERO_ADDRESS, ZERO_BIGDEC } from "./constants";

export function getOrCreateUser(id: BigInt): User {
  let user = User.load(id.toString());
  if (!user) {
    user = new User(id.toString());
    user.address = ZERO_ADDRESS.toHex();
    user.handle = "";
    user.numReviews = ZERO;
    user.rating = ZERO_BIGDEC;
    user.createdAt = ZERO;
    user.updatedAt = ZERO;
    user.delegates = [];
    user.save();
  }
  return user;
}
