"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { PollarProvider, type PollarConfig } from "@pollar/react";
import type { PollarClientConfig, StellarNetwork } from "@pollar/core";
// Styles for the Pollar-provided modals (login, send, receive, balance, ...).
import "@pollar/react/styles.css";

const publishableKey = process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY ?? "";
const stellarNetwork =
  (process.env.NEXT_PUBLIC_POLLAR_NETWORK as StellarNetwork | undefined) ??
  "testnet";

export function Providers({ children }: { children: ReactNode }) {
  // The PollarProvider locks the client at first render, so build the config
  // once and keep it stable across re-renders.
  const [clientConfig] = useState<PollarClientConfig>(() => ({
    apiKey: publishableKey,
    stellarNetwork,
  }));

  // PollarClient relies on browser APIs (WebCrypto, localStorage), so only
  // construct it on the client. useSyncExternalStore returns the server
  // snapshot (false) during SSR and the first paint, then the client snapshot
  // (true) — giving a clean client-only mount with no hydration mismatch.
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isClient) {
    return <div className="flex flex-1 items-center justify-center bg-white" />;
  }

  // Providing appConfig skips the remote /applications/config fetch, so the app
  // boots even before a dashboard application is fully provisioned. The SDK
  // fills any omitted UI fields with its own defaults.
  const appConfig: PollarConfig = {
    application: { name: "Pollar Wallet" },
    styles: { accentColor: "#0560a9", emailEnabled: true, embeddedWallets: true },
  };

  return (
    <PollarProvider client={clientConfig} appConfig={appConfig}>
      {children}
    </PollarProvider>
  );
}
