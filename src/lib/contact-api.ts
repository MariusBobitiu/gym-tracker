import { request } from "@/lib/api-client";
import type { ApiError, ApiResult } from "@/lib/api-client";

export type ContactRequest = {
  name?: string;
  email?: string;
  subject: string;
  message: string;
  website?: string;
};

export async function requestContact(
  payload: ContactRequest
): Promise<ApiResult<void, ApiError>> {
  return request<void>("/v1/contact", {
    method: "POST",
    body: payload,
  });
}
