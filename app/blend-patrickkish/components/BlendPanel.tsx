"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePollar } from "@pollar/react";
import { LoginScreen } from "../../components/LoginScreen";
import {
  blendConfig,
  getBlendNetwork,
  toTokenAmount,
} from "../lib/config";
import {
  buildBlendSupplyXdr,
  buildBlendWithdrawXdr,
} from "../lib/build-transaction";
import {
  fetchBlendPosition,
  type BlendPositionSnapshot,
} from "../lib/pool-data";

type TxStatus =
  | { kind: "idle" }
  | { kind: "building" }
  | { kind: "signing" }
  | { kind: "success"; hash: string; label: string }
  | { kind: "error"; message: string };

const inputClass =
  "rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand-tint";

export function BlendPanel() {
  const {
    isAuthenticated,
    walletAddress,
    walletBalance,
    refreshWalletBalance,
    signAndSubmitTx,
    verified,
    openLoginModal,
  } = usePollar();

  const network = useMemo(() => getBlendNetwork(), []);

  const [lendAmount, setLendAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [position, setPosition] = useState<BlendPositionSnapshot | null>(null);
  const [positionError, setPositionError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>({ kind: "idle" });

  const usdcBalance = useMemo(() => {
    if (walletBalance.step !== "loaded") return null;
    const match = walletBalance.data.balances.find(
      (b) => b.code === "USDC" || b.issuer === blendConfig.usdcId,
    );
    return match?.available ?? "0";
  }, [walletBalance]);

  const refreshPosition = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const snapshot = await fetchBlendPosition(
        network,
        blendConfig.poolId,
        blendConfig.usdcId,
        walletAddress,
      );
      setPosition(snapshot);
      setPositionError(null);
    } catch (err) {
      setPositionError(
        err instanceof Error ? err.message : "Failed to load pool position",
      );
    }
  }, [network, walletAddress]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (walletBalance.step === "idle") void refreshWalletBalance();
  }, [isAuthenticated, walletBalance.step, refreshWalletBalance]);

  useEffect(() => {
    if (!isAuthenticated || !walletAddress) return;
    void refreshPosition();
    const timer = setInterval(() => void refreshPosition(), blendConfig.pollIntervalMs);
    return () => clearInterval(timer);
  }, [isAuthenticated, walletAddress, refreshPosition]);

  async function submitBlendTx(
    label: string,
    buildXdr: () => Promise<string>,
  ) {
    setTxStatus({ kind: "building" });
    try {
      const unsignedXdr = await buildXdr();
      setTxStatus({ kind: "signing" });
      const outcome = await signAndSubmitTx(unsignedXdr);

      if (outcome.status === "success" || outcome.status === "pending") {
        setTxStatus({ kind: "success", hash: outcome.hash, label });
        void refreshWalletBalance();
        void refreshPosition();
        return;
      }

      setTxStatus({
        kind: "error",
        message:
          outcome.details ?? outcome.resultCode ?? "Transaction failed",
      });
    } catch (err) {
      setTxStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Unexpected error",
      });
    }
  }

  async function handleLend(e: React.FormEvent) {
    e.preventDefault();
    if (!walletAddress || !verified) return;

    const amount = toTokenAmount(lendAmount);
    if (amount <= BigInt(0)) return;

    await submitBlendTx("Lend", () =>
      buildBlendSupplyXdr({
        pool: blendConfig.poolId,
        asset: blendConfig.usdcId,
        from: walletAddress,
        amount,
        network,
      }),
    );
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!walletAddress || !verified) return;

    const amount = toTokenAmount(withdrawAmount);
    if (amount <= BigInt(0)) return;

    await submitBlendTx("Withdraw", () =>
      buildBlendWithdrawXdr({
        pool: blendConfig.poolId,
        asset: blendConfig.usdcId,
        from: walletAddress,
        amount,
        network,
      }),
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const busy = txStatus.kind === "building" || txStatus.kind === "signing";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Blend + Pollar</h1>
        <p className="text-sm text-zinc-600">
          Lend USDC to the Blend testnet pool and withdraw with your Pollar wallet.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Wallet
        </p>
        <p className="mt-1 break-all font-mono text-xs text-zinc-800">
          {walletAddress}
        </p>
        <p className="mt-3 text-sm text-zinc-700">
          Available USDC:{" "}
          <span className="font-semibold">{usdcBalance ?? "…"}</span>
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your position</h2>
          <span className="text-xs text-zinc-500">live · 10s</span>
        </div>

        {positionError && (
          <p className="mb-3 text-sm text-red-600">{positionError}</p>
        )}

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-zinc-500">Supplied USDC</dt>
            <dd className="font-semibold text-zinc-900">
              {position?.supplied ?? "…"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Supply APY</dt>
            <dd className="font-semibold text-zinc-900">
              {position ? `${(position.supplyApy * 100).toFixed(2)}%` : "…"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Supply APR</dt>
            <dd className="font-semibold text-zinc-900">
              {position ? `${(position.supplyApr * 100).toFixed(2)}%` : "…"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Ledger</dt>
            <dd className="font-mono text-xs text-zinc-800">
              {position?.latestLedger ?? "…"}
            </dd>
          </div>
        </dl>
      </section>

      <form onSubmit={handleLend} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Lend USDC</h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Amount</span>
          <input
            value={lendAmount}
            onChange={(e) => setLendAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className={inputClass}
            disabled={busy}
          />
        </label>
        <button
          type="submit"
          disabled={busy || !verified || !lendAmount}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-brand px-6 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {txStatus.kind === "signing" ? "Signing…" : "Lend to Blend"}
        </button>
      </form>

      <form
        onSubmit={handleWithdraw}
        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
      >
        <h2 className="mb-3 text-lg font-semibold">Withdraw USDC</h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Amount</span>
          <input
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className={inputClass}
            disabled={busy}
          />
        </label>
        {position && (
          <button
            type="button"
            onClick={() => setWithdrawAmount(position.supplied)}
            className="mt-2 text-xs font-medium text-brand hover:underline"
          >
            Withdraw max ({position.supplied} USDC)
          </button>
        )}
        <button
          type="submit"
          disabled={busy || !verified || !withdrawAmount}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-brand bg-white px-6 text-sm font-medium text-brand transition-colors hover:bg-brand-tint disabled:cursor-not-allowed disabled:opacity-50"
        >
          {txStatus.kind === "signing" ? "Signing…" : "Withdraw from Blend"}
        </button>
      </form>

      {txStatus.kind === "success" && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-medium">{txStatus.label} submitted</p>
          <p className="mt-1 break-all font-mono text-xs">{txStatus.hash}</p>
          <button
            type="button"
            onClick={() => setTxStatus({ kind: "idle" })}
            className="mt-2 text-xs font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {txStatus.kind === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {txStatus.message}
          <button
            type="button"
            onClick={() => setTxStatus({ kind: "idle" })}
            className="mt-2 block text-xs font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {!verified && (
        <p className="text-center text-xs text-zinc-500">
          Verifying session…{" "}
          <button
            type="button"
            onClick={() => openLoginModal()}
            className="text-brand underline"
          >
            Re-login
          </button>
        </p>
      )}
    </div>
  );
}
