"use client";

import Image from "next/image";
import { usePollar } from "@pollar/react";

const keyConfigured =
  !!process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY.includes("xxxx");

export function LoginScreen() {
  // `openLoginModal` shows Pollar's hosted login (Google, GitHub, email OTP and
  // external wallets like Freighter / Albedo) rendered by the SDK.
  const { openLoginModal } = usePollar();

  return (
    <main className="flex w-full max-w-md flex-1 flex-col items-center justify-center gap-7 px-6 py-24 text-center">
      <Image
        src="/logo.png"
        alt="Pollar"
        width={88}
        height={88}
        priority
        className="h-20 w-20 object-contain"
      />

      <div className="flex flex-col items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-3 py-1 text-xs font-medium text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Conectado a testnet
        </span>
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-brand">Pollar</span> Wallet
        </h1>
        <p className="max-w-xs text-base leading-7 text-zinc-500">
          Conecta tu wallet de Pollar para ver tu saldo, enviar y recibir
          dinero.
        </p>
      </div>

      <button
        type="button"
        onClick={openLoginModal}
        disabled={!keyConfigured}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        Iniciar sesión con Pollar
      </button>

      {!keyConfigured && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Configura{" "}
          <code className="font-mono">NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY</code>{" "}
          en <code className="font-mono">.env.local</code> con tu key de{" "}
          <a
            href="https://dashboard.pollar.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            dashboard.pollar.xyz
          </a>{" "}
          y reinicia el servidor.
        </p>
      )}
    </main>
  );
}
