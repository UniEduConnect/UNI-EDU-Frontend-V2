import { apiClient } from "@/lib/apiClient";
import type { CreateReviewRequest, Paged, ReviewResponse } from "@/types/api";

export async function createClassReview(
  classId: string,
  payload: CreateReviewRequest,
): Promise<ReviewResponse> {
  return apiClient.post(`/classes/${classId}/review`, payload) as unknown as Promise<ReviewResponse>;
}

export const getMyReviews = (page = 1) =>
  apiClient.get("/me/reviews", { params: { page } }) as unknown as Promise<Paged<ReviewResponse>>;
export const getReviewsForModeration = (params: { Status?: string; Page?: number } = {}) =>
  apiClient.get("/Reviews", { params }) as unknown as Promise<Paged<ReviewResponse>>;
export const hideReview = (id: number) => apiClient.patch(`/Reviews/${id}/hide`) as unknown as Promise<unknown>;
export const unhideReview = (id: number) => apiClient.patch(`/Reviews/${id}/unhide`) as unknown as Promise<unknown>;
