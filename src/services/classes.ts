import { apiClient } from "@/lib/apiClient";
import type {
  ClassDetailResponse,
  ClassItem,
  ClassListQuery,
  CreateClassRequest,
  Paged,
  UpdateClassRequest,
} from "@/types/api";

export async function getClasses(query: ClassListQuery = {}): Promise<Paged<ClassItem>> {
  return apiClient.get("/Classes", { params: query }) as unknown as Promise<Paged<ClassItem>>;
}

// GET /Classes/{id} returns the full ClassDetailResponse (sessions[], materials[], escrow fields).
export async function getClass(id: string): Promise<ClassDetailResponse> {
  return apiClient.get(`/Classes/${id}`) as unknown as Promise<ClassDetailResponse>;
}

export async function createClass(payload: CreateClassRequest): Promise<ClassItem> {
  return apiClient.post("/Classes", payload) as unknown as Promise<ClassItem>;
}

export async function updateClass(id: string, payload: UpdateClassRequest): Promise<ClassItem> {
  return apiClient.patch(`/Classes/${id}`, payload) as unknown as Promise<ClassItem>;
}
