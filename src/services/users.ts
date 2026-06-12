import { apiClient } from "@/lib/apiClient";
import type { CheckPhoneUserRequest, CheckPhoneUserResponse, CurrentUserResponse } from "@/types/api";

export async function checkPhone(payload: CheckPhoneUserRequest): Promise<CheckPhoneUserResponse> {
  return apiClient.post("/Users/check-phone", payload) as unknown as Promise<CheckPhoneUserResponse>;
}

/** GET /Users/me — current authenticated user (any role). */
export async function getMe(): Promise<CurrentUserResponse> {
  return apiClient.get("/Users/me") as unknown as Promise<CurrentUserResponse>;
}
