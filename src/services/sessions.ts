import { apiClient } from "@/lib/apiClient";
import type { CreateAbsenceRequest, CreateSessionRequest, EndSessionRequest, RateSessionRequest, SessionResponse } from "@/types/api";

export async function getClassSessions(classId: string): Promise<SessionResponse[]> {
  return apiClient.get(`/classes/${classId}/sessions`) as unknown as Promise<SessionResponse[]>;
}

// Tutor adds a teaching session to a class's schedule.
export async function createSession(classId: string, payload: CreateSessionRequest): Promise<SessionResponse> {
  return apiClient.post(`/classes/${classId}/sessions`, payload) as unknown as Promise<SessionResponse>;
}

export async function startSession(id: string): Promise<SessionResponse> {
  return apiClient.patch(`/Sessions/${id}/start`) as unknown as Promise<SessionResponse>;
}

export async function endSession(id: string, payload: EndSessionRequest): Promise<SessionResponse> {
  return apiClient.patch(`/Sessions/${id}/end`, payload) as unknown as Promise<SessionResponse>;
}

export async function confirmSession(id: string): Promise<SessionResponse> {
  return apiClient.patch(`/Sessions/${id}/confirm`) as unknown as Promise<SessionResponse>;
}

// Tutor marks a session done directly (one step, no parent-confirm).
export async function completeSession(id: string): Promise<SessionResponse> {
  return apiClient.patch(`/Sessions/${id}/complete`) as unknown as Promise<SessionResponse>;
}

export async function rateSession(id: string, payload: RateSessionRequest): Promise<SessionResponse> {
  return apiClient.patch(`/Sessions/${id}/rate`, payload) as unknown as Promise<SessionResponse>;
}

export async function requestAbsence(id: string, payload: CreateAbsenceRequest): Promise<SessionResponse> {
  return apiClient.post(`/Sessions/${id}/absence`, payload) as unknown as Promise<SessionResponse>;
}

export async function approveAbsence(id: string): Promise<SessionResponse> {
  return apiClient.patch(`/Sessions/${id}/absence/approve`) as unknown as Promise<SessionResponse>;
}

export async function rejectAbsence(id: string): Promise<SessionResponse> {
  return apiClient.patch(`/Sessions/${id}/absence/reject`) as unknown as Promise<SessionResponse>;
}

export const getMySessions = (params: { from?: string; to?: string } = {}) =>
  apiClient.get("/me/sessions", { params }) as unknown as Promise<SessionResponse[]>;
