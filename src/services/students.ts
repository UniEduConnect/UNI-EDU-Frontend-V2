import { apiClient } from "@/lib/apiClient";
import type {
  AvailableSlotDto,
  AiSlotSuggestion,
  ParentLinkRequestResponse,
  StudentDashboard,
  StudentProfileResponse,
  UpdateAvailabilityRequest,
  UpdateStudentProfileRequest,
} from "@/types/api";

export const getMyProfile = () => apiClient.get("/Students/me") as unknown as Promise<StudentProfileResponse>;
export const updateMyProfile = (payload: UpdateStudentProfileRequest) =>
  apiClient.put("/Students/me", payload) as unknown as Promise<StudentProfileResponse>;
export const getMyAvailability = () => apiClient.get("/Students/me/availability") as unknown as Promise<AvailableSlotDto[]>;
export const updateMyAvailability = (payload: UpdateAvailabilityRequest) =>
  apiClient.put("/Students/me/availability", payload) as unknown as Promise<AvailableSlotDto[]>;
// Smart matching: weekly slots where this student AND the tutor are both free.
export const getCommonSlots = (tutorId: string) =>
  apiClient.get(`/Students/me/common-slots/${tutorId}`) as unknown as Promise<AvailableSlotDto[]>;

// AI-ranked slots from the tutor∩student free-slot overlap. sessionsPerWeek tells the AI how
// many sessions/week to schedule (bounded by the overlap).
export const getAiSlots = (tutorId: string, sessionsPerWeek?: number) =>
  apiClient.get(`/Students/me/ai-slots/${tutorId}`, {
    params: sessionsPerWeek ? { sessionsPerWeek } : undefined,
  }) as unknown as Promise<AiSlotSuggestion[]>;
export const getMyDashboard = () => apiClient.get("/Students/me/dashboard") as unknown as Promise<StudentDashboard>;

// Parent-link requests addressed to this student (consent-based linking).
export const getParentLinkRequests = () =>
  apiClient.get("/Students/me/parent-links") as unknown as Promise<ParentLinkRequestResponse[]>;
export const approveParentLink = (id: string) =>
  apiClient.post(`/Students/me/parent-links/${id}/approve`) as unknown as Promise<unknown>;
export const rejectParentLink = (id: string) =>
  apiClient.post(`/Students/me/parent-links/${id}/reject`) as unknown as Promise<unknown>;
