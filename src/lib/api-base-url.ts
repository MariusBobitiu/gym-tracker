/**
 * Dev-only API base URL override. This file is part of the JS bundle, so
 * changing it and reloading the app updates the URL without rebuilding the
 * native app.
 *
 * Development builds embed EXPO_PUBLIC_API_URL from the last native build
 * (often localhost). Set the override below to your laptop's LAN IP when
 * testing on a physical device, then reload the app.
 *
 * Example: "http://192.168.1.173:8080"
 */
export const API_BASE_URL_OVERRIDE: string | undefined = undefined;
