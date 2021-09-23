import { init } from "./utils/init";
import { upload } from "./utils/upload";
import config from "../config.json";

const run = async () => {
  if (!config.artifact_path) {
    throw new Error("Please add artifact path to .env file");
  }
  const codeId = await upload(config.artifact_path);
  const addr = await init(codeId, config.init_msg, config.init_coins, true);

  console.log("Deploy contract ", codeId, "at", addr);
};

run();
