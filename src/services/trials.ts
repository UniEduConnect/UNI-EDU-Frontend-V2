import { apiClient } from "@/lib/apiClient";
import type { CreateTrialRequest, Paged, TrialItem } from "@/types/api";

export const getTrials = (params: { Status?: string; Page?: number } = {}) =>
  apiClient.get("/Trials", { params }) as unknown as Promise<Paged<TrialItem>>;
export const createTrial = (payload: CreateTrialRequest) =>
  apiClient.post("/Trials", payload) as unknown as Promise<TrialItem>;
export const acceptTrial = (id: string) => apiClient.patch(`/Trials/${id}/accept`) as unknown as Promise<TrialItem>;
export const rejectTrial = (id: string, note?: string) =>
  apiClient.patch(`/Trials/${id}/reject`, { note }) as unknown as Promise<TrialItem>;
export const completeTrial = (id: string, body: { feedback?: string; rating?: number } = {}) =>
  apiClient.patch(`/Trials/${id}/complete`, body) as unknown as Promise<TrialItem>;
