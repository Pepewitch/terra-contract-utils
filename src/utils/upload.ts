import { MsgStoreCode } from "@terra-money/terra.js";
import { feeDenom, terra, wallet } from "../constant";
import fs from "fs";
import { retry } from "./retry";

export const upload = async (path: string) => {
  const fee = await retry(async () => {
    return terra.tx.estimateFee(
      wallet.key.accAddress,
      [
        new MsgStoreCode(
          wallet.key.accAddress,
          fs.readFileSync(path, { encoding: "base64" })
        ),
      ],
      { feeDenoms: [feeDenom] }
    );
  });

  const codeId = await retry(async () => {
    const tx = await wallet.createAndSignTx({
      msgs: [
        new MsgStoreCode(
          wallet.key.accAddress,
          fs.readFileSync(path, { encoding: "base64" })
        ),
      ],
      fee,
    });
    const res = await terra.tx.broadcast(tx);
    if (
      res.raw_log ===
      "unauthorized: signature verification failed; verify correct account sequence and chain-id"
    ) {
      throw res;
    }

    const logs = JSON.parse(res.raw_log);
    let codeId;
    for (const log of logs) {
      if (log.events) {
        for (const ev of log.events) {
          if (ev.type === "store_code") {
            codeId = ev.attributes.find((att) => att.key === "code_id")?.value;
            break;
          }
        }
      }
      if (codeId) {
        break;
      }
    }
    return codeId;
  });

  return Number(codeId);
};
