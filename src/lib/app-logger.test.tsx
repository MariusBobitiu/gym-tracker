import {
  getErrorDetails,
  sanitizeLogData,
  truncateLogString,
} from "@/lib/app-logger";

jest.mock("react-native-mmkv", () => ({
  createMMKV: () => ({
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

describe("app-logger", (): void => {
  it("redacts sensitive fields in log data", (): void => {
    const result = sanitizeLogData({
      accessToken: "secret",
      email: "user@example.com",
      nested: { token: "abc" },
      hasEmail: true,
    }) as Record<string, unknown>;

    expect(result).toEqual({
      accessToken: "[redacted]",
      email: "[redacted]",
      nested: { token: "[redacted]" },
      hasEmail: true,
    });
  });

  it("truncates long strings", (): void => {
    const longValue = "a".repeat(400);
    const truncated = truncateLogString(longValue);
    expect(truncated.length).toBeLessThan(longValue.length);
    expect(truncated.endsWith("...")).toBe(true);
  });

  it("extracts error details safely", (): void => {
    const details = getErrorDetails(new Error("Boom"));
    expect(details).toEqual(
      expect.objectContaining({ name: "Error", message: "Boom" })
    );

    const customDetails = getErrorDetails({
      code: 401,
      message: "Unauthorized",
    });
    expect(customDetails).toEqual({ code: "401", message: "Unauthorized" });
  });
});
