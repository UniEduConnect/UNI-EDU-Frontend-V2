import { apiClient } from "@/lib/apiClient";
import type {
  CreateQuestionRequest,
  Paged,
  QuestionListQuery,
  QuestionResponse,
  UpdateQuestionRequest,
} from "@/types/api";

export async function getQuestions(query: QuestionListQuery = {}): Promise<Paged<QuestionResponse>> {
  return apiClient.get("/Questions", { params: query }) as unknown as Promise<Paged<QuestionResponse>>;
}

export async function getQuestion(id: number): Promise<QuestionResponse> {
  return apiClient.get(`/Questions/${id}`) as unknown as Promise<QuestionResponse>;
}

export async function createQuestion(payload: CreateQuestionRequest): Promise<QuestionResponse> {
  return apiClient.post("/Questions", payload) as unknown as Promise<QuestionResponse>;
}

export async function updateQuestion(
  id: number,
  payload: UpdateQuestionRequest,
): Promise<QuestionResponse> {
  return apiClient.put(`/Questions/${id}`, payload) as unknown as Promise<QuestionResponse>;
}

export async function deleteQuestion(id: number): Promise<void> {
  await apiClient.delete(`/Questions/${id}`);
}
