import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as officeService from "@/services/office";
import { getOfficeReports } from "@/services/reports";
import type { AiScheduleRequest, AttendanceListQuery, CreateIncidentRequest, IncidentListQuery, ResolveIncidentRequest } from "@/types/api";

/** GET /Office/reports — { totalSessions, completedSessions, missedSessions, openIncidents, resolvedIncidents }. */
export function useOfficeReports() {
  return useQuery({ queryKey: ["office-reports"], queryFn: () => getOfficeReports() });
}

/** POST /Office/ai-schedule — generate a suggested schedule. */
export function useGenerateAiSchedule() {
  return useMutation({ mutationFn: (payload: AiScheduleRequest) => officeService.generateAiSchedule(payload) });
}

/** GET /Office/rooms — room inventory + free/occupied counts. */
export function useRoomInventory() {
  return useQuery({ queryKey: ["office-rooms"], queryFn: () => officeService.getRoomInventory() });
}

export function useAttendance(query: AttendanceListQuery = {}) {
  const result = useQuery({
    queryKey: ["office-attendance", query],
    queryFn: () => officeService.getAttendance(query),
  });
  return { ...result, attendance: result.data?.items ?? [] };
}

export function useIncidents(query: IncidentListQuery = {}) {
  const result = useQuery({
    queryKey: ["office-incidents", query],
    queryFn: () => officeService.getIncidents(query),
  });
  return { ...result, incidents: result.data?.items ?? [] };
}

function useOfficeInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["office-attendance"] });
    qc.invalidateQueries({ queryKey: ["office-incidents"] });
  };
}

export function useConfirmAttendance() {
  const invalidate = useOfficeInvalidate();
  return useMutation({
    mutationFn: (sessionId: string) => officeService.confirmAttendance(sessionId),
    onSuccess: invalidate,
  });
}

export function useCreateIncident() {
  const invalidate = useOfficeInvalidate();
  return useMutation({
    mutationFn: (payload: CreateIncidentRequest) => officeService.createIncident(payload),
    onSuccess: invalidate,
  });
}

export function useInvestigateIncident() {
  const invalidate = useOfficeInvalidate();
  return useMutation({
    mutationFn: (id: string) => officeService.investigateIncident(id),
    onSuccess: invalidate,
  });
}

export function useResolveIncident() {
  const invalidate = useOfficeInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResolveIncidentRequest }) =>
      officeService.resolveIncident(id, payload),
    onSuccess: invalidate,
  });
}
