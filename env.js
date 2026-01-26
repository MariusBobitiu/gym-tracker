/**
 * Client environment variables exposed to Expo.
 * Keep this file in sync with app.config.ts.
 */
const ClientEnv = {
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_MMKV_ENCRYPTION_KEY: process.env.EXPO_PUBLIC_MMKV_ENCRYPTION_KEY,
};

module.exports = { ClientEnv };
