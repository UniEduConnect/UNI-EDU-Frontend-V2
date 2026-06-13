import { useMutation } from "@tanstack/react-query";
import * as svc from "@/services/aiTests";

export function useGenerateAiTest() {
  return useMutation({
    mutationFn: ({ subjectId, grade, topic }: { subjectId: string; grade?: number; topic?: string }) =>
      svc.generateAiTest(subjectId, grade, topic),
  });
}

export function useSubmitAiTest() {
  return useMutation({
    mutationFn: ({ attemptId, answers }: { attemptId: string; answers: number[] }) =>
      svc.submitAiTest(attemptId, answers),
  });
}
