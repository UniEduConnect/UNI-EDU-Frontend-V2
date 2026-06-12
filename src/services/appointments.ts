import { apiClient } from "@/lib/apiClient";
import type { AdminUserResponse, AppointmentItem, Paged, SaveAppointmentRequest } from "@/types/api";

export const getAppointments = (params: { Status?: string; Page?: number } = {}) =>
  apiClient.get("/Office/appointments", { params }) as unknown as Promise<Paged<AppointmentItem>>;
export const createAppointment = (payload: SaveAppointmentRequest) =>
  apiClient.post("/Office/appointments", payload) as unknown as Promise<AppointmentItem>;
export const updateAppointment = (id: string, payload: SaveAppointmentRequest) =>
  apiClient.put(`/Office/appointments/${id}`, payload) as unknown as Promise<AppointmentItem>;
export const cancelAppointment = (id: string) => apiClient.patch(`/Office/appointments/${id}/cancel`) as unknown as Promise<unknown>;
export const completeAppointment = (id: string) => apiClient.patch(`/Office/appointments/${id}/complete`) as unknown as Promise<unknown>;

export const getRegistrations = (params: { Status?: string; Page?: number } = {}) =>
  apiClient.get("/Office/registrations", { params }) as unknown as Promise<Paged<AdminUserResponse>>;
export const approveRegistration = (id: string) => apiClient.post(`/Office/registrations/${id}/approve`) as unknown as Promise<unknown>;
export const rejectRegistration = (id: string, note?: string) => apiClient.post(`/Office/registrations/${id}/reject`, { note }) as unknown as Promise<unknown>;
export const generateAiSchedule = (payload: unknown) => apiClient.post("/Office/ai-schedule", payload) as unknown as Promise<unknown>;
