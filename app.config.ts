import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, ".env") });

const appJson = require("./app.json");
const expoConfig = appJson.expo ?? appJson;

function buildExtra() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  return {
    ...expoConfig.extra,
    EXPO_PUBLIC_API_URL: apiUrl,
    EXPO_PUBLIC_MMKV_ENCRYPTION_KEY: process.env.EXPO_PUBLIC_MMKV_ENCRYPTION_KEY,
  };
}

export default {
  ...expoConfig,
  extra: buildExtra(),
};
