import { apiClient } from "@/lib/apiClient";
import type { AiTestResponse, AiTestResultResponse } from "@/types/api";

// Generate an AI test for a subject (the tutor takes it to qualify to accept a class/student).
// grade/topic level the test to the class the tutor is applying for.
export const generateAiTest = (subjectId: string, grade?: number, topic?: string) =>
  apiClient.post("/AiTest/generate", { subjectId, grade, topic }) as unknown as Promise<AiTestResponse>;

// Submit answers (selected option index per question, in order) → score + passed.
export const submitAiTest = (attemptId: string, answers: number[]) =>
  apiClient.post(`/AiTest/${attemptId}/submit`, { answers }) as unknown as Promise<AiTestResultResponse>;
