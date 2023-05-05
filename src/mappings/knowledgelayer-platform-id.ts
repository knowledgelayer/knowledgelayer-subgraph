import { BigInt, DataSourceContext, store } from "@graphprotocol/graph-ts";
import { PlatformData } from "../../generated/templates";
import { MintFeeUpdated } from "../../generated/KnowledgeLayerID/KnowledgeLayerID";
import {
  BuyFeeUpdated,
  CidUpdated,
  Mint,
  OriginFeeUpdated,
  PostingFeeUpdated,
  SignerUpdated,
} from "../../generated/KnowledgeLayerPlatformID/KnowledgeLayerPlatformID";
import { getOrCreatePlatform, getOrCreateProtocol } from "../getters";

export function handleCidUpdated(event: CidUpdated): void {
  const platformId = event.params.platformId;
  const platform = getOrCreatePlatform(platformId);
  const oldCid = platform.cid;
  const newCid = event.params.newCid;
  const dataId = newCid + "-" + event.block.timestamp.toString();

  platform.cid = newCid;
  platform.updatedAt = event.block.timestamp;
  if (!oldCid) {
    platform.createdAt = event.block.timestamp;
  }

  const context = new DataSourceContext();
  context.setBigInt("platformId", platformId);
  context.setString("id", dataId);

  if (oldCid) {
    store.remove("PlatformDescription", oldCid);
  }

  PlatformData.createWithContext(newCid, context);

  platform.description = dataId;
  platform.save();
}

export function handleMint(event: Mint): void {
  const platform = getOrCreatePlatform(event.params.platformId);
  platform.address = event.params.platformOwnerAddress;
  platform.name = event.params.platformName;
  platform.signer = event.params.platformOwnerAddress;
  platform.createdAt = event.block.timestamp;
  platform.updatedAt = event.block.timestamp;
  platform.save();

  const protocol = getOrCreateProtocol();
  const currentTotalMintFees = protocol.totalMintFees || new BigInt(0);
  protocol.totalMintFees = currentTotalMintFees.plus(event.params.fee);
  protocol.save();
}

export function handleMintFeeUpdated(event: MintFeeUpdated): void {
  const protocol = getOrCreateProtocol();
  protocol.platformMintFee = event.params.mintFee;
  protocol.save();
}

export function handleOriginFeeUpdated(event: OriginFeeUpdated): void {
  const platform = getOrCreatePlatform(event.params.platformId);
  platform.originFee = event.params.originFee;
  platform.save();
}

export function handleBuyFeeUpdated(event: BuyFeeUpdated): void {
  const platform = getOrCreatePlatform(event.params.platformId);
  platform.buyFee = event.params.buyFee;
  platform.save();
}

export function handlePostingFeeUpdated(event: PostingFeeUpdated): void {
  const platform = getOrCreatePlatform(event.params.platformId);
  platform.postingFee = event.params.postingFee;
  platform.save();
}

export function handleSignerUpdated(event: SignerUpdated): void {
  const platform = getOrCreatePlatform(event.params.platformId);
  platform.signer = event.params.signer;
  platform.save();
}
