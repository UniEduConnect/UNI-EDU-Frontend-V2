import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as questionsService from "@/services/questions";
import type { CreateQuestionRequest, QuestionListQuery, UpdateQuestionRequest } from "@/types/api";

export function useQuestions(query: QuestionListQuery = {}) {
  const result = useQuery({
    queryKey: ["questions", query],
    queryFn: () => questionsService.getQuestions(query),
  });
  return { ...result, questions: result.data?.items ?? [] };
}

export function useQuestion(id: number | undefined) {
  return useQuery({
    queryKey: ["question", id],
    queryFn: () => questionsService.getQuestion(id as number),
    enabled: id != null,
  });
}

function useQuestionsInvalidate() {
  const qc = useQueryClient();
  return (id?: number) => {
    qc.invalidateQueries({ queryKey: ["questions"] });
    if (id != null) qc.invalidateQueries({ queryKey: ["question", id] });
  };
}

export function useCreateQuestion() {
  const invalidate = useQuestionsInvalidate();
  return useMutation({
    mutationFn: (payload: CreateQuestionRequest) => questionsService.createQuestion(payload),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateQuestion() {
  const invalidate = useQuestionsInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateQuestionRequest }) =>
      questionsService.updateQuestion(id, payload),
    onSuccess: (_d, v) => invalidate(v.id),
  });
}

export function useDeleteQuestion() {
  const invalidate = useQuestionsInvalidate();
  return useMutation({
    mutationFn: (id: number) => questionsService.deleteQuestion(id),
    onSuccess: () => invalidate(),
  });
}
