import { Coins, MsgExecuteContract } from "@terra-money/terra.js";
import { feeDenom, terra, wallet } from "../constant";
import { retry } from "./retry";

export const execute = async (
  address: string,
  msgObj: any,
  coins?: Coins.Input
) => {
  const fee = await retry(async () => {
    return terra.tx.estimateFee(
      wallet.key.accAddress,
      [new MsgExecuteContract(wallet.key.accAddress, address, msgObj, coins)],
      { feeDenoms: [feeDenom] }
    );
  });

  const txHash = await retry(async () => {
    const tx = await wallet.createAndSignTx({
      msgs: [
        new MsgExecuteContract(wallet.key.accAddress, address, msgObj, coins),
      ],
      fee,
    });
    const result = await terra.tx.broadcast(tx);
    if (
      result.raw_log ===
      "unauthorized: signature verification failed; verify correct account sequence and chain-id"
    ) {
      throw result;
    }
    const txHash = result.txhash;
    return txHash;
  });
	
  return txHash;
};
