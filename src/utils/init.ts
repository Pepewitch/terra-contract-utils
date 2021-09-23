import { MsgInstantiateContract } from "@terra-money/terra.js";
import { feeDenom, terra, wallet } from "../constant";
import { retry } from "./retry";

export const init = async (
  codeId: number,
  msgObj: any,
  initCoins = [],
  migratable = false
) => {
  const migrationAddress = migratable ? wallet.key.accAddress : undefined;
  const msgs = [
    new MsgInstantiateContract(
      wallet.key.accAddress,
      migrationAddress,
      codeId,
      msgObj,
      initCoins
    ),
  ];
  const fee = await retry(async () => {
    return terra.tx.estimateFee(wallet.key.accAddress, msgs, {
      feeDenoms: [feeDenom],
    });
  });

  const address = await retry(async () => {
    const tx = await wallet.createAndSignTx({
      msgs,
      fee,
    });
    const result = await terra.tx.broadcast(tx);
    if (
      result.raw_log ===
      "unauthorized: signature verification failed; verify correct account sequence and chain-id"
    ) {
      throw result;
    }
    const logs = JSON.parse(result.raw_log);
    let addr;
    for (const log of logs) {
      if (log.events) {
        for (const ev of log.events) {
          if (ev.type === "instantiate_contract") {
            addr = ev.attributes.find(
              (att) => att.key === "contract_address"
            )?.value;
            break;
          }
        }
      }
      if (addr) {
        break;
      }
    }
    return addr;
  });

  return address;
};
