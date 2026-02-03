import * as Crypto from "expo-crypto";
import { generateNonce, sha256 } from "@/lib/auth/apple-auth";

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(),
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: { SHA256: "SHA256" },
  CryptoEncoding: { HEX: "hex" },
}));

const mockedCrypto = Crypto as jest.Mocked<typeof Crypto>;

describe("apple-auth", (): void => {
  beforeEach((): void => {
    jest.clearAllMocks();
  });

  it("generates a hex nonce from random bytes", async (): Promise<void> => {
    mockedCrypto.getRandomBytesAsync.mockResolvedValue(
      Uint8Array.from([0, 15, 255])
    );

    const result = await generateNonce(3);

    expect(result).toBe("000fff");
  });

  it("hashes values with SHA-256 hex encoding", async (): Promise<void> => {
    mockedCrypto.digestStringAsync.mockResolvedValue("hashed");

    const result = await sha256("value");

    expect(mockedCrypto.digestStringAsync).toHaveBeenCalledWith(
      mockedCrypto.CryptoDigestAlgorithm.SHA256,
      "value",
      { encoding: mockedCrypto.CryptoEncoding.HEX }
    );
    expect(result).toBe("hashed");
  });
});
