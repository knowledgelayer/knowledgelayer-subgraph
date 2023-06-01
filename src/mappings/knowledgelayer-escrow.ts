import { Course, Transaction, User } from "../../generated/schema";
import {
  getOrCreateToken,
  getOrCreateProtocol,
  getOrCreateTransaction,
  getOrCreateUser,
  getOrCreatePayment,
  getOrCreateOriginPlatformFee,
  getOrCreatePlatformGain,
  getOrCreateBuyPlatformFee,
  getOrCreatePlatform,
} from "../getters";
import {
  BuyFeeReleased,
  OriginFeeReleased,
  Payment,
  ProtocolFeeUpdated,
  TransactionCreated,
} from "../../generated/KnowledgeLayerEscrow/KnowledgeLayerEscrow";
import { concatenate, generateUniqueId } from "../utils";

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
  transaction.platform = getOrCreatePlatform(event.params.buyPlatformId).id;
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
  const paymentId = generateUniqueId(event);
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

export function handleOriginFeeReleased(event: OriginFeeReleased): void {
  const feePaymentId = generateUniqueId(event);
  const originFeePayment = getOrCreateOriginPlatformFee(feePaymentId);
  const token = event.params.token;
  originFeePayment.platform = event.params.platformId.toString();
  originFeePayment.course = event.params.courseId.toString();
  originFeePayment.token = getOrCreateToken(token).id;
  originFeePayment.amount = event.params.amount;

  originFeePayment.createdAt = event.block.timestamp;
  originFeePayment.save();

  const platformGainId = concatenate(
    event.params.platformId.toString(),
    event.params.token.toHex(),
  );
  const platformGain = getOrCreatePlatformGain(platformGainId);
  platformGain.platform = event.params.platformId.toString();
  platformGain.token = getOrCreateToken(token).id;
  platformGain.totalOriginFeeGain = platformGain.totalOriginFeeGain.plus(event.params.amount);

  platformGain.save();
}

export function handleBuyFeeReleased(event: BuyFeeReleased): void {
  const feePaymentId = generateUniqueId(event);
  const buyFeePayment = getOrCreateBuyPlatformFee(feePaymentId);
  const token = event.params.token;
  buyFeePayment.platform = event.params.platformId.toString();
  buyFeePayment.course = event.params.courseId.toString();
  buyFeePayment.token = getOrCreateToken(token).id;
  buyFeePayment.amount = event.params.amount;

  buyFeePayment.createdAt = event.block.timestamp;
  buyFeePayment.save();

  const platformGainId = concatenate(
    event.params.platformId.toString(),
    event.params.token.toHex(),
  );
  const platformGain = getOrCreatePlatformGain(platformGainId);
  platformGain.platform = event.params.platformId.toString();
  platformGain.token = getOrCreateToken(token).id;
  platformGain.totalBuyFeeGain = platformGain.totalBuyFeeGain.plus(event.params.amount);

  platformGain.save();
}
