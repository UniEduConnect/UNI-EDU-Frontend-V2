import { apiClient } from "@/lib/apiClient";
import type {
  LoginRequest,
  LoginResponse,
  ParentRegister,
  StudentRegister,
  TokenResponse,
  TutorRegister,
} from "@/types/api";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiClient.post("/login", payload) as unknown as Promise<LoginResponse>;
}

export async function registerStudent(payload: StudentRegister): Promise<unknown> {
  return apiClient.post("/register/student", payload) as unknown as Promise<unknown>;
}

export async function registerTutor(payload: TutorRegister): Promise<unknown> {
  return apiClient.post("/register/tutor", payload) as unknown as Promise<unknown>;
}

export async function registerParent(payload: ParentRegister): Promise<unknown> {
  return apiClient.post("/register/parent", payload) as unknown as Promise<unknown>;
}

export async function refreshToken(): Promise<TokenResponse> {
  return apiClient.post("/refresh-token") as unknown as Promise<TokenResponse>;
}

export async function logout(): Promise<void> {
  await apiClient.post("/logout");
}
