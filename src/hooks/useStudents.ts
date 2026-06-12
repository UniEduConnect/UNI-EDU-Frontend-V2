import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as studentsService from "@/services/students";
import { getStudentReport } from "@/services/reports";
import type { UpdateAvailabilityRequest, UpdateStudentProfileRequest } from "@/types/api";

/** GET /Students/me — the logged-in student's own profile. */
export function useMyStudentProfile() {
  return useQuery({ queryKey: ["student-me"], queryFn: () => studentsService.getMyProfile() });
}

/** PUT /Students/me — update the logged-in student's profile. */
export function useUpdateMyStudentProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStudentProfileRequest) => studentsService.updateMyProfile(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-me"] }),
  });
}

/** GET /Students/me/report — exam/class summary for the student. */
export function useStudentReport() {
  return useQuery({ queryKey: ["student-report"], queryFn: () => getStudentReport() });
}

/** GET /Students/me/availability. */
export function useMyStudentAvailability() {
  const result = useQuery({
    queryKey: ["student-availability"],
    queryFn: () => studentsService.getMyAvailability(),
  });
  return { ...result, slots: result.data ?? [] };
}

/** GET /Students/me/common-slots/{tutorId} — slots where student & tutor are both free. */
export function useCommonSlots(tutorId: string | undefined) {
  const result = useQuery({
    queryKey: ["common-slots", tutorId],
    queryFn: () => studentsService.getCommonSlots(tutorId as string),
    enabled: !!tutorId,
  });
  return { ...result, slots: result.data ?? [] };
}

/** GET /Students/me/ai-slots/{tutorId} — AI-ranked study-slot suggestions. */
export function useAiSlots(tutorId: string | undefined) {
  const result = useQuery({
    queryKey: ["ai-slots", tutorId],
    queryFn: () => studentsService.getAiSlots(tutorId as string),
    enabled: !!tutorId,
  });
  return { ...result, slots: result.data ?? [] };
}

/** PUT /Students/me/availability. */
export function useUpdateMyStudentAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAvailabilityRequest) => studentsService.updateMyAvailability(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-availability"] }),
  });
}

/** GET /Students/me/parent-links — pending parent-link requests for this student. */
export function useParentLinkRequests() {
  const result = useQuery({ queryKey: ["parent-links"], queryFn: () => studentsService.getParentLinkRequests() });
  return { ...result, requests: result.data ?? [] };
}

/** Approve/reject a pending parent-link request. */
export function useRespondParentLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      approve ? studentsService.approveParentLink(id) : studentsService.rejectParentLink(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parent-links"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
