import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import {
  loginWithApple,
  type AppleAuthPayload,
  type AppleAuthSession,
} from "@/lib/auth/auth-api";

const NONCE_BYTES = 32;
const STATE_BYTES = 16;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function generateNonce(
  length: number = NONCE_BYTES
): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(length);
  return toHex(bytes);
}

export async function sha256(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
}

function mapFullName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null
): AppleAuthPayload["fullName"] | undefined {
  if (!fullName) return undefined;
  const { givenName, familyName } = fullName;
  if (!givenName && !familyName) return undefined;
  return {
    givenName: givenName ?? undefined,
    familyName: familyName ?? undefined,
  };
}

const APPLE_AUTH_CANCEL_CODES = [
  "ERR_CANCELED",
  "CANCELED",
  "ERR_REQUEST_CANCELED",
] as const;

export function isAppleAuthCanceled(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if (!("code" in error)) return false;
  const code = String((error as { code?: string | number }).code ?? "");
  return APPLE_AUTH_CANCEL_CODES.includes(
    code as (typeof APPLE_AUTH_CANCEL_CODES)[number]
  );
}

export async function signInWithApple(): Promise<AppleAuthSession> {
  const rawNonce = await generateNonce();
  const state = await generateNonce(STATE_BYTES);

  // Apple returns the SHA-256 of the raw nonce in the identity token.
  // We send the raw nonce to the backend so it can validate the token claim.
  const hashedNonce = await sha256(rawNonce);

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
    // Random state reduces the risk of CSRF in the auth response.
    state,
  });

  if (!credential.identityToken) {
    throw new Error("Apple identity token missing.");
  }

  if (!credential.authorizationCode) {
    throw new Error("Apple authorization code missing.");
  }

  const payload: AppleAuthPayload = {
    identityToken: credential.identityToken,
    authorizationCode: credential.authorizationCode,
    nonce: rawNonce,
    fullName: mapFullName(credential.fullName),
    email: credential.email ?? undefined,
  };

  const result = await loginWithApple(payload);
  if (!result.ok) {
    throw result.error;
  }

  return result.data;
}
