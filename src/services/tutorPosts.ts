import { apiClient } from "@/lib/apiClient";
import type {
  AcceptApplicationRequest,
  CreateTutorPostRequest,
  Paged,
  TutorPostApplicationResponse,
  TutorPostListQuery,
  TutorPostResponse,
} from "@/types/api";

// Tutor posts a "looking for students" ad.
export const createTutorPost = (payload: CreateTutorPostRequest) =>
  apiClient.post("/TutorPosts", payload) as unknown as Promise<unknown>;

// Students/parents browse open tutor posts.
export const getOpenTutorPosts = (query: TutorPostListQuery = {}) =>
  apiClient.get("/TutorPosts/open", { params: query }) as unknown as Promise<Paged<TutorPostResponse>>;

// A tutor's own posts.
export const getMyTutorPosts = () =>
  apiClient.get("/TutorPosts/me") as unknown as Promise<TutorPostResponse[]>;

export const closeTutorPost = (id: string) =>
  apiClient.patch(`/TutorPosts/${id}/close`) as unknown as Promise<unknown>;

// Student registers ("đăng ký học") on a tutor's post.
export const applyTutorPost = (id: string) =>
  apiClient.post(`/TutorPosts/${id}/apply`) as unknown as Promise<unknown>;

// Tutor's pending applications (students who registered on their posts).
export const getTutorPostApplications = () =>
  apiClient.get("/TutorPosts/applications") as unknown as Promise<TutorPostApplicationResponse[]>;

// Tutor accepts an application after passing an AI test (>=80%).
export const acceptTutorPostApplication = (appId: string, payload: AcceptApplicationRequest) =>
  apiClient.post(`/TutorPosts/applications/${appId}/accept`, payload) as unknown as Promise<unknown>;
