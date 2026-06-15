"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { usePollar } from "@pollar/react";
import type { TxBuildBody } from "@pollar/core";

type PaymentParams = Extract<TxBuildBody, { operation: "payment" }>["params"];
type PaymentAsset = PaymentParams["asset"];

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; hash: string }
  | { kind: "error"; message: string };

export function SendTab({ onSent }: { onSent?: () => void }) {
  const { walletBalance, refreshWalletBalance, runTx, verified } = usePollar();

  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [assetKey, setAssetKey] = useState("");
  const [memo, setMemo] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    if (walletBalance.step === "idle") void refreshWalletBalance();
  }, [walletBalance.step, refreshWalletBalance]);

  // Only assets the wallet actually holds can be sent.
  const assets = useMemo(
    () => (walletBalance.step === "loaded" ? walletBalance.data.balances : []),
    [walletBalance],
  );

  const selected =
    assets.find((a) => `${a.code}-${a.issuer ?? "native"}` === assetKey) ??
    assets[0];

  const destinationValid = /^G[A-Z2-7]{55}$/.test(destination.trim());
  const amountNum = Number(amount);
  const amountValid = amount !== "" && amountNum > 0;
  const exceedsBalance =
    selected != null && amountValid && amountNum > Number(selected.available);
  const canSubmit =
    verified &&
    destinationValid &&
    amountValid &&
    !exceedsBalance &&
    selected != null &&
    status.kind !== "submitting";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selected) return;

    const asset: PaymentAsset =
      selected.type === "native"
        ? { type: "native" }
        : {
            type: selected.type,
            code: selected.code,
            issuer: selected.issuer!,
          };

    setStatus({ kind: "submitting" });
    try {
      const outcome = await runTx(
        "payment",
        { destination: destination.trim(), amount, asset },
        memo.trim() ? { memo: { type: "text", value: memo.trim() } } : undefined,
      );

      if (outcome.status === "success" || outcome.status === "pending") {
        setStatus({ kind: "success", hash: outcome.hash });
        setDestination("");
        setAmount("");
        setMemo("");
        void refreshWalletBalance();
      } else {
        setStatus({
          kind: "error",
          message: outcome.details ?? outcome.resultCode ?? "La transacción falló.",
        });
      }
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Error inesperado.",
      });
    }
  }

  if (status.kind === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl dark:bg-green-500/15">
          ✓
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          ¡Pago enviado!
        </h2>
        <p className="break-all font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {status.hash}
        </p>
        <button
          type="button"
          onClick={() => (onSent ? onSent() : setStatus({ kind: "idle" }))}
          className="rounded-full bg-violet-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          Listo
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Enviar dinero
      </h2>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Activo
        </span>
        <select
          value={selected ? `${selected.code}-${selected.issuer ?? "native"}` : ""}
          onChange={(e) => setAssetKey(e.target.value)}
          disabled={assets.length === 0}
          className="rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-violet-500 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-50"
        >
          {assets.length === 0 && <option>Cargando activos…</option>}
          {assets.map((a) => (
            <option
              key={`${a.code}-${a.issuer ?? "native"}`}
              value={`${a.code}-${a.issuer ?? "native"}`}
            >
              {a.code} — disponible {a.available}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Destinatario
        </span>
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="G…"
          spellCheck={false}
          className="rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 font-mono text-sm text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:text-zinc-50"
        />
        {destination !== "" && !destinationValid && (
          <span className="text-xs text-red-600 dark:text-red-400">
            Dirección de Stellar inválida (debe empezar con G y tener 56
            caracteres).
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Monto
        </span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0.00"
          className="rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:text-zinc-50"
        />
        {exceedsBalance && (
          <span className="text-xs text-red-600 dark:text-red-400">
            Saldo insuficiente.
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Memo <span className="text-zinc-400">(opcional)</span>
        </span>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Nota para el destinatario"
          className="rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:text-zinc-50"
        />
      </label>

      {status.kind === "error" && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-1 flex h-12 items-center justify-center rounded-full bg-violet-600 px-6 font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status.kind === "submitting" ? "Enviando…" : "Enviar pago"}
      </button>

      {!verified && (
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Verificando tu sesión…
        </p>
      )}
    </form>
  );
}
