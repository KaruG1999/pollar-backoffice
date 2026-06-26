import {
  PoolContractV2,
  RequestType,
  type Network,
} from "@blend-capital/blend-sdk";
import {
  BASE_FEE,
  rpc,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";

export interface BlendTxParams {
  pool: string;
  asset: string;
  from: string;
  amount: bigint;
  network: Network;
}

function buildSubmitOperation(
  pool: string,
  from: string,
  asset: string,
  amount: bigint,
  requestType: RequestType,
): string {
  const poolContract = new PoolContractV2(pool);
  return poolContract.submit({
    from,
    spender: from,
    to: from,
    requests: [
      {
        request_type: requestType,
        address: asset,
        amount,
      },
    ],
  });
}

async function simulateToUnsignedXdr(
  from: string,
  operationXdr: string,
  network: Network,
): Promise<string> {
  const stellarRpc = new rpc.Server(network.rpc);
  const account = await stellarRpc.getAccount(from);

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: network.passphrase,
  })
    .addOperation(xdr.Operation.fromXDR(operationXdr, "base64"))
    .setTimeout(300)
    .build();

  const simulation = await stellarRpc.simulateTransaction(transaction);

  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(simulation.error);
  }

  if (!rpc.Api.isSimulationSuccess(simulation)) {
    throw new Error("Blend transaction simulation failed");
  }

  return rpc
    .assembleTransaction(transaction, simulation)
    .build()
    .toXDR();
}

export async function buildBlendSupplyXdr(
  params: BlendTxParams,
): Promise<string> {
  const operation = buildSubmitOperation(
    params.pool,
    params.from,
    params.asset,
    params.amount,
    RequestType.SupplyCollateral,
  );

  return simulateToUnsignedXdr(params.from, operation, params.network);
}

export async function buildBlendWithdrawXdr(
  params: BlendTxParams,
): Promise<string> {
  const operation = buildSubmitOperation(
    params.pool,
    params.from,
    params.asset,
    params.amount,
    RequestType.WithdrawCollateral,
  );

  return simulateToUnsignedXdr(params.from, operation, params.network);
}
