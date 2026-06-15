"use client";

import { usePollar } from "@pollar/react";
import { LoginScreen } from "./components/LoginScreen";
import { WalletDashboard } from "./components/WalletDashboard";

export default function Home() {
  const { isAuthenticated } = usePollar();

  return (
    <div className="flex flex-1 flex-col items-center bg-white font-sans text-zinc-900">
      {isAuthenticated ? <WalletDashboard /> : <LoginScreen />}
    </div>
  );
}
