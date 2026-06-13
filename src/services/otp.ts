import { apiClient } from "@/lib/apiClient";

export const sendOtp = (email: string, purpose = "register") =>
  apiClient.post("/otp/send", { email, purpose }) as unknown as Promise<unknown>;

export const verifyOtp = (email: string, code: string, purpose = "register") =>
  apiClient.post("/otp/verify", { email, code, purpose }) as unknown as Promise<unknown>;
