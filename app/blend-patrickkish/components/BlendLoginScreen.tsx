"use client";

import Link from "next/link";
import { usePollar } from "@pollar/react";

const keyConfigured =
  !!process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY.includes("xxxx");

export function BlendLoginScreen() {
  const { openLoginModal } = usePollar();

  return (
    <main className="flex w-full max-w-md flex-1 flex-col items-center justify-center gap-7 px-6 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        Blend + Pollar
      </h1>

      <button
        type="button"
        onClick={openLoginModal}
        disabled={!keyConfigured}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-brand px-6 font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        Sign in with Pollar
      </button>

      <Link
        href="/"
        className="text-sm font-medium text-brand hover:underline"
      >
        Home
      </Link>

      {!keyConfigured && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Missing <code className="font-mono">NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY</code>
        </p>
      )}
    </main>
  );
}
