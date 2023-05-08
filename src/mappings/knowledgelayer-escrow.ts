import { Course, Transaction, User } from "../../generated/schema";
import {
  getOrCreateToken,
  getOrCreateProtocol,
  getOrCreateTransaction,
  getOrCreateUser,
  getOrCreatePayment,
} from "../getters";
import {
  Payment,
  ProtocolFeeUpdated,
  TransactionCreated,
} from "../../generated/KnowledgeLayerEscrow/KnowledgeLayerEscrow";
import { generateUniqueId } from "../utils";

enum PaymentType {
  Release,
  Reimburse,
}

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

export function handlePayment(event: Payment): void {
  const paymentId = generateUniqueId(event.transaction.hash.toHex(), event.logIndex.toString());
  const payment = getOrCreatePayment(paymentId);

  payment.createdAt = event.block.timestamp;
  payment.transaction = Transaction.load(event.params.transactionId.toString())!.id;

  if (event.params.paymentType === PaymentType.Release) {
    payment.paymentType = "Release";
  }
  if (event.params.paymentType === PaymentType.Reimburse) {
    payment.paymentType = "Reimburse";
  }

  payment.transactionHash = event.transaction.hash.toHex();
  payment.save();
}
