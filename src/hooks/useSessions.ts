import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as sessionsService from "@/services/sessions";
import type { CreateAbsenceRequest, CreateSessionRequest, EndSessionRequest, RateSessionRequest } from "@/types/api";

export function useClassSessions(classId: string | undefined) {
  const result = useQuery({
    queryKey: ["class-sessions", classId],
    queryFn: () => sessionsService.getClassSessions(classId as string),
    enabled: !!classId,
  });
  return { ...result, sessions: result.data ?? [] };
}

/** Invalidate session + class queries after a session mutation. */
function useSessionInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["class-sessions"] });
    qc.invalidateQueries({ queryKey: ["class"] });
    qc.invalidateQueries({ queryKey: ["classes"] });
    qc.invalidateQueries({ queryKey: ["my-sessions"] }); // parent/student schedule
  };
}

export function useCreateSession() {
  const invalidate = useSessionInvalidate();
  return useMutation({
    mutationFn: ({ classId, payload }: { classId: string; payload: CreateSessionRequest }) =>
      sessionsService.createSession(classId, payload),
    onSuccess: invalidate,
  });
}

export function useStartSession() {
  const invalidate = useSessionInvalidate();
  return useMutation({
    mutationFn: (id: string) => sessionsService.startSession(id),
    onSuccess: invalidate,
  });
}

export function useEndSession() {
  const invalidate = useSessionInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EndSessionRequest }) =>
      sessionsService.endSession(id, payload),
    onSuccess: invalidate,
  });
}

export function useCompleteSession() {
  const invalidate = useSessionInvalidate();
  return useMutation({
    mutationFn: (id: string) => sessionsService.completeSession(id),
    onSuccess: invalidate,
  });
}

export function useConfirmSession() {
  const invalidate = useSessionInvalidate();
  return useMutation({
    mutationFn: (id: string) => sessionsService.confirmSession(id),
    onSuccess: invalidate,
  });
}

export function useRateSession() {
  const invalidate = useSessionInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RateSessionRequest }) =>
      sessionsService.rateSession(id, payload),
    onSuccess: invalidate,
  });
}

export function useRequestAbsence() {
  const invalidate = useSessionInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateAbsenceRequest }) =>
      sessionsService.requestAbsence(id, payload),
    onSuccess: invalidate,
  });
}

export function useApproveAbsence() {
  const invalidate = useSessionInvalidate();
  return useMutation({
    mutationFn: (id: string) => sessionsService.approveAbsence(id),
    onSuccess: invalidate,
  });
}

export function useRejectAbsence() {
  const invalidate = useSessionInvalidate();
  return useMutation({
    mutationFn: (id: string) => sessionsService.rejectAbsence(id),
    onSuccess: invalidate,
  });
}
