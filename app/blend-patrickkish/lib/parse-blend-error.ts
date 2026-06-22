/** Map Soroban / simulation errors to user-facing messages. */

export function parseBlendError(raw: string): string {
  const text = raw.toLowerCase();

  if (
    text.includes("trustline entry is missing") ||
    text.includes("op_no_trust")
  ) {
    return "USDC trustline is not enabled for this wallet.";
  }

  if (text.includes("insufficient") || text.includes("underfunded")) {
    return "Insufficient USDC balance.";
  }

  if (text.includes("simulation") || text.includes("hostfunction")) {
    if (text.includes("trustline")) {
      return parseBlendError("trustline entry is missing");
    }
    return "Transaction simulation failed.";
  }

  return raw;
}
