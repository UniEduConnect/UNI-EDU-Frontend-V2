import { apiClient } from "@/lib/apiClient";
import type {
  AcceptClassRequestRequest,
  ClassRequestListQuery,
  ClassRequestResponse,
  CreateClassRequestRequest,
  Paged,
} from "@/types/api";

// Student posts a "looking for a tutor" request.
export const createClassRequest = (payload: CreateClassRequestRequest) =>
  apiClient.post("/ClassRequests", payload) as unknown as Promise<unknown>;

// Tutor/teacher browses open requests ("find students").
export const getOpenClassRequests = (query: ClassRequestListQuery = {}) =>
  apiClient.get("/ClassRequests/open", { params: query }) as unknown as Promise<Paged<ClassRequestResponse>>;

// A student's own requests.
export const getMyClassRequests = () =>
  apiClient.get("/ClassRequests/me") as unknown as Promise<ClassRequestResponse[]>;

// Tutor accepts a request (requires a passing tutor-test submission id).
export const acceptClassRequest = (id: string, payload: AcceptClassRequestRequest) =>
  apiClient.post(`/ClassRequests/${id}/accept`, payload) as unknown as Promise<unknown>;
