import { apiClient } from "@/lib/apiClient";
import type { ChildProgressAnalyticsResponse, Paged, ParentChild, SubmissionResponse } from "@/types/api";

export async function getMyChildren(): Promise<ParentChild[]> {
  // Backend may return a bare array or a paged wrapper; normalize to an array.
  const data = (await apiClient.get("/Parents/me/children")) as unknown as
    | ParentChild[]
    | { items?: ParentChild[] };
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

// Parent requests to link to a student by email (student must confirm).
export const linkChild = (childEmail: string) =>
  apiClient.post("/Parents/me/children/link", { childEmail }) as unknown as Promise<unknown>;

// A child's exam submissions (the caller must be the child's parent).
export const getChildExams = (childId: string, page = 1) =>
  apiClient.get(`/Parents/me/children/${childId}/exams`, { params: { page } }) as unknown as Promise<
    Paged<SubmissionResponse>
  >;

// A child's monthly progress + per-subject scores (real analytics).
export const getChildProgress = (childId: string) =>
  apiClient.get(`/Parents/me/children/${childId}/progress`) as unknown as Promise<ChildProgressAnalyticsResponse>;

// Parent tops up a child's wallet (to fund tuition/escrow).
export const fundChild = (childId: string, amount: number) =>
  apiClient.post(`/Parents/me/children/${childId}/fund`, { amount }) as unknown as Promise<unknown>;
