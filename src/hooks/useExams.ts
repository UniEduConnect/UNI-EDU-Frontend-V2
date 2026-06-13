import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as examsService from "@/services/exams";
import type {
  CreateExamRequest,
  GenerateExamWithAiRequest,
  ExamAiConfig,
  ExamListQuery,
  SetExamQuestionsRequest,
  SubmitExamRequest,
  UpdateExamRequest,
} from "@/types/api";

/** GET /Exams/stats — aggregate exam stats (untyped on the wire). */
export function useExamStats() {
  return useQuery({ queryKey: ["exam-stats"], queryFn: () => examsService.getExamStats() });
}

/** GET /Exams/{id}/attempts. */
export function useExamAttempts(id: number | undefined, page = 1) {
  return useQuery({
    queryKey: ["exam-attempts", id, page],
    queryFn: () => examsService.getExamAttempts(id as number, page),
    enabled: id != null,
  });
}

/** GET /Exams/ai-config. */
export function useExamAiConfig() {
  return useQuery({ queryKey: ["exam-ai-config"], queryFn: () => examsService.getExamAiConfig() });
}

/** PUT /Exams/ai-config. */
export function useUpdateExamAiConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ExamAiConfig>) => examsService.updateExamAiConfig(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exam-ai-config"] }),
  });
}

export function useExams(query: ExamListQuery = {}) {
  const result = useQuery({
    queryKey: ["exams", query],
    queryFn: () => examsService.getExams(query),
  });
  return { ...result, exams: result.data?.items ?? [] };
}

export function useExam(id: number | undefined) {
  return useQuery({
    queryKey: ["exam", id],
    queryFn: () => examsService.getExam(id as number),
    enabled: id != null,
  });
}

export function useMySubmissions(page = 1) {
  const result = useQuery({
    queryKey: ["my-submissions", page],
    queryFn: () => examsService.getMySubmissions(page),
  });
  return { ...result, submissions: result.data?.items ?? [] };
}

export function useExamSubmissions(id: number | undefined, page = 1) {
  const result = useQuery({
    queryKey: ["exam-submissions", id, page],
    queryFn: () => examsService.getExamSubmissions(id as number, page),
    enabled: id != null,
  });
  return { ...result, submissions: result.data?.items ?? [] };
}

function useExamsInvalidate() {
  const qc = useQueryClient();
  return (id?: number) => {
    qc.invalidateQueries({ queryKey: ["exams"] });
    if (id != null) qc.invalidateQueries({ queryKey: ["exam", id] });
  };
}

export function useCreateExam() {
  const invalidate = useExamsInvalidate();
  return useMutation({
    mutationFn: (payload: CreateExamRequest) => examsService.createExam(payload),
    onSuccess: () => invalidate(),
  });
}

/** POST /Exams/generate-with-ai — AI-generate + persist an exam. */
export function useGenerateExamWithAi() {
  const invalidate = useExamsInvalidate();
  return useMutation({
    mutationFn: (payload: GenerateExamWithAiRequest) => examsService.generateExamWithAi(payload),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateExam() {
  const invalidate = useExamsInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateExamRequest }) =>
      examsService.updateExam(id, payload),
    onSuccess: (_d, v) => invalidate(v.id),
  });
}

export function useDeleteExam() {
  const invalidate = useExamsInvalidate();
  return useMutation({
    mutationFn: (id: number) => examsService.deleteExam(id),
    onSuccess: () => invalidate(),
  });
}

export function useSetExamQuestions() {
  const invalidate = useExamsInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SetExamQuestionsRequest }) =>
      examsService.setExamQuestions(id, payload),
    onSuccess: (_d, v) => invalidate(v.id),
  });
}

export function useSubmitExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SubmitExamRequest }) =>
      examsService.submitExam(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-submissions"] }),
  });
}
