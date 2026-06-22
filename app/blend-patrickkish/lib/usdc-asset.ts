import type { EnabledAssetRecord, WalletBalanceRecord } from "@pollar/core";
import {
  BLEND_TESTNET_USDC_CODE,
  BLEND_TESTNET_USDC_ISSUER,
  blendConfig,
} from "./config";

/** Blend testnet USDC Soroban contract (SAC). */
export const BLEND_TESTNET_USDC_CONTRACT = blendConfig.usdcId;

export { BLEND_TESTNET_USDC_CODE, BLEND_TESTNET_USDC_ISSUER };

export function isBlendUsdcClassicAsset(asset: {
  code: string;
  issuer?: string | null;
}): boolean {
  return (
    asset.code === BLEND_TESTNET_USDC_CODE &&
    asset.issuer === BLEND_TESTNET_USDC_ISSUER
  );
}

/** Trustline asset for Pollar dashboard + setTrustline (classic, not SAC contract id). */
export function blendUsdcTrustlineAsset() {
  return {
    code: BLEND_TESTNET_USDC_CODE,
    issuer: BLEND_TESTNET_USDC_ISSUER,
  };
}

export function findUsdcBalance(
  balances: WalletBalanceRecord[],
): WalletBalanceRecord | undefined {
  return balances.find((b) => isBlendUsdcClassicAsset(b));
}

export function findUsdcEnabledAsset(
  assets: EnabledAssetRecord[],
): EnabledAssetRecord | undefined {
  return assets.find((a) => isBlendUsdcClassicAsset(a));
}
