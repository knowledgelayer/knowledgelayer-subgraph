import { Course, User } from "../../generated/schema";
import {
  getOrCreateToken,
  getOrCreateProtocol,
  getOrCreateTransaction,
  getOrCreateUser,
} from "../getters";
import {
  ProtocolFeeUpdated,
  TransactionCreated,
} from "../../generated/KnowledgeLayerEscrow/KnowledgeLayerEscrow";

export function handleTransactionCreated(event: TransactionCreated): void {
  const transaction = getOrCreateTransaction(event.params.id, event.block.timestamp);

  transaction.sender = User.load(event.params.senderId.toString())!.id;
  transaction.receiver = User.load(event.params.receiverId.toString())!.id;
  transaction.token = getOrCreateToken(event.params.token).id;
  transaction.amount = event.params.amount;
  transaction.course = Course.load(event.params.courseId.toString())!.id;
  transaction.protocolFee = event.params.protocolFee;
  transaction.originFee = event.params.originFee;
  transaction.buyFee = event.params.buyFee;
  transaction.save();

  const user = getOrCreateUser(event.params.senderId);
  user.purchasedCourses = user.purchasedCourses.concat([event.params.courseId.toString()]);
  user.save();
}

export function handleProtocolFeeUpdated(event: ProtocolFeeUpdated): void {
  const protocol = getOrCreateProtocol();
  protocol.escrowFee = event.params.fee;
  protocol.save();
}
