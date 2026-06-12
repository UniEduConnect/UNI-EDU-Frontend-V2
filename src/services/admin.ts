import { apiClient } from "@/lib/apiClient";
import type {
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AdminUserListQuery,
  AdminUserResponse,
  AuditLogResponse,
  Paged,
  RejectUserRequest,
} from "@/types/api";

export async function createUser(payload: AdminCreateUserRequest): Promise<AdminUserResponse> {
  return apiClient.post("/Admin/users", payload) as unknown as Promise<AdminUserResponse>;
}

export async function updateUser(id: string, payload: AdminUpdateUserRequest): Promise<AdminUserResponse> {
  return apiClient.put(`/Admin/users/${id}`, payload) as unknown as Promise<AdminUserResponse>;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/Admin/users/${id}`);
}

export async function getUsers(query: AdminUserListQuery = {}): Promise<Paged<AdminUserResponse>> {
  return apiClient.get("/Admin/users", { params: query }) as unknown as Promise<Paged<AdminUserResponse>>;
}

export async function getUser(id: string): Promise<AdminUserResponse> {
  return apiClient.get(`/Admin/users/${id}`) as unknown as Promise<AdminUserResponse>;
}

export async function approveUser(id: string): Promise<unknown> {
  return apiClient.post(`/Admin/users/${id}/approve`) as unknown as Promise<unknown>;
}

export async function rejectUser(id: string, payload: RejectUserRequest): Promise<unknown> {
  return apiClient.post(`/Admin/users/${id}/reject`, payload) as unknown as Promise<unknown>;
}

export async function suspendUser(id: string): Promise<unknown> {
  return apiClient.post(`/Admin/users/${id}/suspend`) as unknown as Promise<unknown>;
}

export async function getAuditLogs(page = 1): Promise<Paged<AuditLogResponse>> {
  return apiClient.get("/Admin/audit-logs", { params: { page } }) as unknown as Promise<
    Paged<AuditLogResponse>
  >;
}
