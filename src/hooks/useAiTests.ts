import { useMutation } from "@tanstack/react-query";
import * as svc from "@/services/aiTests";

export function useGenerateAiTest() {
  return useMutation({ mutationFn: (subjectId: string) => svc.generateAiTest(subjectId) });
}

export function useSubmitAiTest() {
  return useMutation({
    mutationFn: ({ attemptId, answers }: { attemptId: string; answers: number[] }) =>
      svc.submitAiTest(attemptId, answers),
  });
}
