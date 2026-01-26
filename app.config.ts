import "dotenv/config";

const appJson = require("./app.json");
const expoConfig = appJson.expo ?? appJson;

function buildExtra() {
  return {
    ...expoConfig.extra,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_MMKV_ENCRYPTION_KEY: process.env.EXPO_PUBLIC_MMKV_ENCRYPTION_KEY,
  };
}

export default {
  ...expoConfig,
  extra: buildExtra(),
};
