import { apiClient } from "@/lib/apiClient";
import type { CreateMaterialRequest, MaterialResponse } from "@/types/api";

export async function getClassMaterials(classId: string): Promise<MaterialResponse[]> {
  return apiClient.get(`/classes/${classId}/materials`) as unknown as Promise<MaterialResponse[]>;
}

export async function addClassMaterial(
  classId: string,
  payload: CreateMaterialRequest,
): Promise<MaterialResponse> {
  return apiClient.post(`/classes/${classId}/materials`, payload) as unknown as Promise<MaterialResponse>;
}

export async function deleteClassMaterial(classId: string, materialId: string): Promise<void> {
  await apiClient.delete(`/classes/${classId}/materials/${materialId}`);
}
