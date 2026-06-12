import { apiClient } from "@/lib/apiClient";
import type { SubjectResponse } from "@/types/api";

export async function getSubjects(): Promise<SubjectResponse[]> {
  return apiClient.get("/Subjects") as unknown as Promise<SubjectResponse[]>;
}

import type { SaveSubjectRequest } from "@/types/api";
export const createSubject = (payload: SaveSubjectRequest) =>
  apiClient.post("/Subjects", payload) as unknown as Promise<SubjectResponse>;
export const updateSubject = (id: string, payload: SaveSubjectRequest) =>
  apiClient.put(`/Subjects/${id}`, payload) as unknown as Promise<SubjectResponse>;
export const deleteSubject = (id: string) => apiClient.delete(`/Subjects/${id}`) as unknown as Promise<unknown>;
