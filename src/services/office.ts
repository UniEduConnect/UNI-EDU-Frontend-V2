import { apiClient } from "@/lib/apiClient";
import type {
  AiScheduleRequest,
  AttendanceListQuery,
  AttendanceResponse,
  CreateIncidentRequest,
  IncidentListQuery,
  IncidentResponse,
  Paged,
  ResolveIncidentRequest,
  RoomInventoryResponse,
} from "@/types/api";

/** POST /Office/ai-schedule — generate a suggested schedule. */
export async function generateAiSchedule(payload: AiScheduleRequest): Promise<unknown> {
  return apiClient.post("/Office/ai-schedule", payload) as unknown as Promise<unknown>;
}

/** GET /Office/rooms — physical room inventory + free/occupied counts. */
export async function getRoomInventory(): Promise<RoomInventoryResponse> {
  return apiClient.get("/Office/rooms") as unknown as Promise<RoomInventoryResponse>;
}

export async function getAttendance(
  query: AttendanceListQuery = {},
): Promise<Paged<AttendanceResponse>> {
  return apiClient.get("/Office/attendance", { params: query }) as unknown as Promise<
    Paged<AttendanceResponse>
  >;
}

export async function getAttendanceById(sessionId: string): Promise<AttendanceResponse> {
  return apiClient.get(`/Office/attendance/${sessionId}`) as unknown as Promise<AttendanceResponse>;
}

export async function confirmAttendance(sessionId: string): Promise<unknown> {
  return apiClient.patch(`/Office/attendance/${sessionId}/confirm`) as unknown as Promise<unknown>;
}

export async function getIncidents(query: IncidentListQuery = {}): Promise<Paged<IncidentResponse>> {
  return apiClient.get("/Office/incidents", { params: query }) as unknown as Promise<
    Paged<IncidentResponse>
  >;
}

export async function createIncident(payload: CreateIncidentRequest): Promise<IncidentResponse> {
  return apiClient.post("/Office/incidents", payload) as unknown as Promise<IncidentResponse>;
}

export async function investigateIncident(id: string): Promise<IncidentResponse> {
  return apiClient.patch(`/Office/incidents/${id}/investigate`) as unknown as Promise<IncidentResponse>;
}

export async function resolveIncident(id: string, payload: ResolveIncidentRequest): Promise<IncidentResponse> {
  return apiClient.patch(`/Office/incidents/${id}/resolve`, payload) as unknown as Promise<IncidentResponse>;
}
