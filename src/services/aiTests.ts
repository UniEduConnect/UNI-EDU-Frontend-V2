import { apiClient } from "@/lib/apiClient";
import type { AiTestResponse, AiTestResultResponse } from "@/types/api";

// Generate an AI test for a subject (the tutor takes it to qualify to accept a class/student).
export const generateAiTest = (subjectId: string) =>
  apiClient.post("/AiTest/generate", { subjectId }) as unknown as Promise<AiTestResponse>;

// Submit answers (selected option index per question, in order) → score + passed.
export const submitAiTest = (attemptId: string, answers: number[]) =>
  apiClient.post(`/AiTest/${attemptId}/submit`, { answers }) as unknown as Promise<AiTestResultResponse>;
