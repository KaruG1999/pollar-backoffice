import { PoolV2 } from "@blend-capital/blend-sdk";
import type { Network } from "@blend-capital/blend-sdk";
import { USDC_DECIMALS } from "./config";

export interface BlendPositionSnapshot {
  supplied: string;
  supplyApy: number;
  supplyApr: number;
  latestLedger: number;
}

export async function fetchBlendPosition(
  network: Network,
  poolId: string,
  assetId: string,
  userId: string,
): Promise<BlendPositionSnapshot> {
  const pool = await PoolV2.load(network, poolId);
  const reserve = pool.reserves.get(assetId);

  if (!reserve) {
    throw new Error("USDC reserve not found in pool");
  }

  const user = await pool.loadUser(userId);
  const collateral = user.getCollateralFloat(reserve);
  const supply = user.getSupplyFloat(reserve);
  const supplied = Math.max(collateral, supply);

  return {
    supplied: supplied.toFixed(USDC_DECIMALS).replace(/\.?0+$/, ""),
    supplyApy: reserve.estSupplyApy,
    supplyApr: reserve.supplyApr,
    latestLedger: reserve.latestLedger,
  };
}
