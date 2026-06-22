# Blend + Pollar (patrickkish)

Client-side Blend lending integration for issue [#5](https://github.com/pollar-xyz/pollar-backoffice/issues/5).

## Route

```
/blend-patrickkish
```

## Run

From the repo root:

```bash
cp .env.example .env.local
# set NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY=pub_testnet_...
npm install
npm run dev
```

Open `http://localhost:3000/blend-patrickkish`.

## Environment variables

| Variable | Required | Default (testnet) |
|----------|----------|-------------------|
| `NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY` | yes | — |
| `NEXT_PUBLIC_POLLAR_NETWORK` | no | `testnet` |
| `NEXT_PUBLIC_BLEND_POOL_ADDRESS` | no | `CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF` |
| `NEXT_PUBLIC_BLEND_USDC_ADDRESS` | no | `CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU` |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | no | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | no | `Test SDF Network ; September 2015` |

Testnet contract addresses come from [blend-utils/testnet.contracts.json](https://github.com/blend-capital/blend-utils/blob/main/testnet.contracts.json).

## Signing spike

The highest-risk step is Soroban auth on a client-built XDR. Flow:

1. `buildBlendSupplyXdr` / `buildBlendWithdrawXdr` build a `PoolContractV2.submit` operation.
2. The transaction is simulated against Soroban RPC (`simulateTransaction` + `assembleTransaction`).
3. Pollar `signAndSubmitTx(unsignedXdr)` signs Soroban auth entries and submits.

If simulation fails, check that the wallet has testnet XLM (friendbot) and **Blend testnet USDC** (not Circle faucet USDC).

## Testnet USDC (important)

Blend on testnet uses its own USDC — **not** Circle centre.io testnet USDC.

| | |
|---|---|
| **Code** | `USDC` |
| **Classic issuer (G-address)** | `GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56` |
| **SAC contract (C-address)** | `CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU` |
| **Pool** | `CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF` (TestnetV2) |

Circle testnet USDC (`GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`) derives to a **different** SAC contract and will not work with this pool.

### Custodial Pollar wallets

Trustlines are enabled from the **Pollar dashboard**, not testnet.blend.capital:

1. **Tokens & Trustlines → Add token** — use code `USDC` and issuer `GATALTGT…` above (not the centre.io preset).
2. **Wallets → Enable trustline** on your test wallet.
3. Copy your wallet **G-address** from `/blend-patrickkish` (shown after login) and ask Pollar ops to fund it with Blend USDC.
4. Lend on `/blend-patrickkish`.

If you see `trustline entry is missing`, the trustline is missing or points at the wrong issuer.

**Where funds live:** wallet USDC → supplied in the pool (position panel) → back to wallet on withdraw.

## Structure

```
app/blend-patrickkish/
  lib/build-transaction.ts   # buildBlendSupplyXdr, buildBlendWithdrawXdr
  lib/pool-data.ts           # position + APY reads (polling)
  lib/config.ts              # env + amount helpers
  components/BlendPanel.tsx  # UI
```

XDR builders are isolated so they can move into a Pollar adapter later.

## Demo checklist

- [ ] Supply USDC on testnet via Pollar `signAndSubmitTx`
- [ ] Withdraw USDC the same way
- [ ] Position + APY update live in the UI
- [ ] Attach a short screen recording to the PR
