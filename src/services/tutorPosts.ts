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

// Read-only pre-check: can the tutor accept this application (pending, owned, no clash, student can
// pay)? Rejects with the server's message if not — the UI gates the AI test on this resolving.
export const checkAcceptTutorPostApplication = (appId: string) =>
  apiClient.get(`/TutorPosts/applications/${appId}/accept-check`) as unknown as Promise<unknown>;
