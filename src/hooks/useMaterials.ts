import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as materialsService from "@/services/materials";
import type { CreateMaterialRequest } from "@/types/api";

export function useClassMaterials(classId: string | undefined) {
  const result = useQuery({
    queryKey: ["class-materials", classId],
    queryFn: () => materialsService.getClassMaterials(classId as string),
    enabled: !!classId,
  });
  return { ...result, materials: result.data ?? [] };
}

export function useAddClassMaterial(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaterialRequest) => materialsService.addClassMaterial(classId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-materials", classId] }),
  });
}

export function useDeleteClassMaterial(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (materialId: string) => materialsService.deleteClassMaterial(classId, materialId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-materials", classId] }),
  });
}
