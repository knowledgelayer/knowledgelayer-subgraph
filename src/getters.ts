import { Address, BigInt, Bytes, dataSource, log } from "@graphprotocol/graph-ts";
import {
  Course,
  FeeClaim,
  FeePayment,
  Platform,
  PlatformGain,
  Protocol,
  Review,
  Token,
  Transaction,
  User,
  UserGain,
} from "../generated/schema";
import { PROTOCOL_ID, ZERO, ZERO_ADDRESS, ZERO_BIGDEC, ZERO_TOKEN_ADDRESS } from "./constants";

import { ERC20 } from "../generated/KnowledgeLayerEscrow/ERC20";

export function getOrCreateUser(id: BigInt): User {
  let user = User.load(id.toString());
  if (!user) {
    user = new User(id.toString());
    user.createdAt = ZERO;
    user.updatedAt = ZERO;
    user.handle = "";
    user.address = ZERO_ADDRESS.toHex();
    user.delegates = [];
    user.rating = ZERO_BIGDEC;
    user.numReviews = ZERO;
    user.save();
  }
  return user;
}

export function getOrCreatePlatform(platformId: BigInt): Platform {
  let platform = Platform.load(platformId.toString());
  if (!platform) {
    platform = new Platform(platformId.toString());
    platform.address = ZERO_ADDRESS;
    platform.name = "";
    platform.createdAt = ZERO;
    platform.updatedAt = ZERO;
    platform.originFee = 0;
    platform.buyFee = 0;
    platform.postingFee = ZERO;
    platform.signer = ZERO_ADDRESS;
    platform.save();
  }
  return platform;
}

export function getOrCreateCourse(id: BigInt): Course {
  let course = Course.load(id.toString());
  if (!course) {
    course = new Course(id.toString());
    course.createdAt = ZERO;
    course.updatedAt = ZERO;
    course.token = getOrCreateToken(ZERO_ADDRESS).id;
    course.save();
  }
  return course;
}

export function getOrCreateTransaction(id: BigInt, blockTimestamp: BigInt = ZERO): Transaction {
  let transaction = Transaction.load(id.toString());
  if (!transaction) {
    transaction = new Transaction(id.toString());
    transaction.token = "";
    transaction.amount = ZERO;
    transaction.protocolFee = 0;
    transaction.originFee = 0;
    transaction.buyFee = 0;
    transaction.save();
  }
  return transaction;
}

export function getOrCreateReview(id: BigInt, serviceId: BigInt, toId: BigInt): Review {
  let review = Review.load(id.toString());
  if (!review) {
    review = new Review(id.toString());
    review.to = getOrCreateUser(toId).id;
    review.course = getOrCreateCourse(serviceId).id;
    review.createdAt = ZERO;
    review.save();
  }
  return review;
}

export function getOrCreateToken(tokenAddress: Bytes): Token {
  const contract = ERC20.bind(Address.fromBytes(tokenAddress));
  let token = Token.load(tokenAddress.toHex());

  if (!token) {
    token = new Token(tokenAddress.toHex());
    token.address = tokenAddress;

    if (tokenAddress.toHex() == ZERO_TOKEN_ADDRESS) {
      if (dataSource.network() == "polygon" || dataSource.network() == "mumbai") {
        token.symbol = "MATIC";
        token.name = "Polygon";
      } else {
        token.symbol = "ETH";
        token.name = "Ether";
      }
      token.decimals = BigInt.fromString("18");
    } else {
      const callResultSymbol = contract.try_symbol();
      if (callResultSymbol.reverted) {
        log.warning("Symbol Reverted {}", ["Reverted"]);
        token.symbol = "UKN";
      } else {
        const result = callResultSymbol.value;
        log.info("Symbol {}", [result]);
        token.symbol = result;
      }

      const callResultName = contract.try_name();
      if (callResultName.reverted) {
        log.warning("Name Reverted {}", ["Reverted"]);
        token.name = "Unknown";
      } else {
        const result = callResultName.value;
        log.info("Name {}", [result]);
        token.name = result;
      }

      const callResultDecimal = contract.try_decimals();
      if (callResultDecimal.reverted) {
        log.warning("Decimals Reverted {}", ["Reverted"]);
        token.decimals = ZERO;
      } else {
        const result = callResultDecimal.value;
        log.info("Decimals {}", [result.toString()]);
        token.decimals = BigInt.fromI32(result);
      }
    }
    // Token initially set to non-allowed. Status will be handled in "handleAllowedTokenListUpdated" handler
    token.allowed = false;
    token.save();
  }

  return token;
}

export function getOrCreateOriginPlatformFee(paymentId: string): FeePayment {
  let originFeePayment = FeePayment.load(paymentId);
  if (!originFeePayment) {
    originFeePayment = new FeePayment(paymentId);
    originFeePayment.type = "OriginPlatform";
    originFeePayment.amount = ZERO;
    originFeePayment.save();
  }
  return originFeePayment;
}

export function getOrCreateBuyPlatformFee(paymentId: string): FeePayment {
  let platformFeePayment = FeePayment.load(paymentId);
  if (!platformFeePayment) {
    platformFeePayment = new FeePayment(paymentId);
    platformFeePayment.type = "BuyPlatform";
    platformFeePayment.amount = ZERO;
    platformFeePayment.save();
  }
  return platformFeePayment;
}

export function getOrCreateClaim(claimId: string): FeeClaim {
  let claim = FeeClaim.load(claimId);
  if (!claim) {
    claim = new FeeClaim(claimId);
    claim.amount = ZERO;
    claim.save();
  }
  return claim;
}

export function getOrCreatePlatformGain(gainId: string): PlatformGain {
  let platformGain = PlatformGain.load(gainId);
  if (!platformGain) {
    platformGain = new PlatformGain(gainId);
    platformGain.totalOriginFeeGain = ZERO;
    platformGain.totalBuyFeeGain = ZERO;
    platformGain.save();
  }
  return platformGain;
}

export function getOrCreateUserGain(gainId: string, userId: BigInt): UserGain {
  let userGain = UserGain.load(gainId);
  if (!userGain) {
    userGain = new UserGain(gainId);
    userGain.totalGain = ZERO;
    userGain.user = getOrCreateUser(userId).id;
    userGain.save();
  }
  return userGain;
}

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(PROTOCOL_ID);
  if (!protocol) {
    protocol = new Protocol(PROTOCOL_ID);
    protocol.userMintFee = ZERO;
    protocol.platformMintFee = ZERO;
    protocol.escrowFee = 0;
    protocol.totalMintFees = ZERO;
    protocol.shortHandlesMaxPrice = ZERO;
  }
  return protocol;
}
