"use client";

import { useEffect } from "react";
import { usePollar } from "@pollar/react";

export function BalanceTab() {
  const { walletBalance, refreshWalletBalance } = usePollar();

  // Load balances on first mount. The SDK keeps the result in `walletBalance`,
  // so switching tabs and coming back does not refetch unless asked.
  useEffect(() => {
    if (walletBalance.step === "idle") {
      void refreshWalletBalance();
    }
  }, [walletBalance.step, refreshWalletBalance]);

  const loading = walletBalance.step === "loading";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tu saldo</h2>
        <button
          type="button"
          onClick={() => void refreshWalletBalance()}
          disabled={loading}
          className="rounded-full px-3 py-1 text-sm font-medium text-brand transition-colors hover:bg-brand-tint disabled:opacity-50"
        >
          {loading ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {walletBalance.step === "error" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudo cargar el saldo: {walletBalance.message}
        </p>
      )}

      {(walletBalance.step === "idle" || loading) && (
        <ul className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <li key={i} className="h-14 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </ul>
      )}

      {walletBalance.step === "loaded" && (
        <>
          {walletBalance.data.balances.length === 0 ? (
            <p className="rounded-xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
              Tu wallet aún no tiene activos.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {walletBalance.data.balances.map((b) => (
                <li
                  key={`${b.code}-${b.issuer ?? "native"}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{b.code}</span>
                    {b.available !== b.balance && (
                      <span className="text-xs text-zinc-500">
                        Disponible: {b.available}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-lg font-semibold tabular-nums">
                    {b.balance}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
