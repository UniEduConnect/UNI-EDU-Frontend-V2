import { apiClient } from "@/lib/apiClient";
import type {
  CreateExamRequest,
  GenerateExamWithAiRequest,
  ExamDetailResponse,
  ExamListItemResponse,
  ExamListQuery,
  Paged,
  SetExamQuestionsRequest,
  SubmissionResponse,
  SubmitExamRequest,
  UpdateExamRequest,
} from "@/types/api";

export async function getExams(query: ExamListQuery = {}): Promise<Paged<ExamListItemResponse>> {
  return apiClient.get("/Exams", { params: query }) as unknown as Promise<Paged<ExamListItemResponse>>;
}

export async function getExam(id: number): Promise<ExamDetailResponse> {
  return apiClient.get(`/Exams/${id}`) as unknown as Promise<ExamDetailResponse>;
}

export async function createExam(payload: CreateExamRequest): Promise<ExamDetailResponse> {
  return apiClient.post("/Exams", payload) as unknown as Promise<ExamDetailResponse>;
}

export async function generateExamWithAi(payload: GenerateExamWithAiRequest): Promise<ExamDetailResponse> {
  return apiClient.post("/Exams/generate-with-ai", payload) as unknown as Promise<ExamDetailResponse>;
}

export async function updateExam(id: number, payload: UpdateExamRequest): Promise<ExamDetailResponse> {
  return apiClient.put(`/Exams/${id}`, payload) as unknown as Promise<ExamDetailResponse>;
}

export async function deleteExam(id: number): Promise<void> {
  await apiClient.delete(`/Exams/${id}`);
}

export async function setExamQuestions(
  id: number,
  payload: SetExamQuestionsRequest,
): Promise<ExamDetailResponse> {
  return apiClient.put(`/Exams/${id}/questions`, payload) as unknown as Promise<ExamDetailResponse>;
}

export async function submitExam(id: number, payload: SubmitExamRequest): Promise<SubmissionResponse> {
  return apiClient.post(`/Exams/${id}/submit`, payload) as unknown as Promise<SubmissionResponse>;
}

export async function getExamSubmissions(id: number, page = 1): Promise<Paged<SubmissionResponse>> {
  return apiClient.get(`/Exams/${id}/submissions`, { params: { page } }) as unknown as Promise<
    Paged<SubmissionResponse>
  >;
}

export async function getMySubmissions(page = 1): Promise<Paged<SubmissionResponse>> {
  return apiClient.get("/Exams/me/submissions", { params: { page } }) as unknown as Promise<
    Paged<SubmissionResponse>
  >;
}

import type { ExamAiConfig } from "@/types/api";
export const getExamStats = () => apiClient.get("/Exams/stats") as unknown as Promise<unknown>;
export const getExamAttempts = (id: number, page = 1) =>
  apiClient.get(`/Exams/${id}/attempts`, { params: { page } }) as unknown as Promise<Paged<unknown>>;
export const getExamAiConfig = () => apiClient.get("/Exams/ai-config") as unknown as Promise<ExamAiConfig>;
export const updateExamAiConfig = (payload: Partial<ExamAiConfig>) =>
  apiClient.put("/Exams/ai-config", payload) as unknown as Promise<ExamAiConfig>;
