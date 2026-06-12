import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as classesService from "@/services/classes";
import * as reviewsService from "@/services/reviews";
import type {
  ClassItem,
  ClassListQuery,
  CreateClassRequest,
  CreateReviewRequest,
  UpdateClassRequest,
} from "@/types/api";

export function useClasses(query: ClassListQuery = {}) {
  const result = useQuery({
    queryKey: ["classes", query],
    queryFn: () => classesService.getClasses(query),
  });
  const classes: ClassItem[] = result.data?.items ?? [];
  return { ...result, classes };
}

export function useClass(id: string | undefined) {
  return useQuery({
    queryKey: ["class", id],
    queryFn: () => classesService.getClass(id as string),
    enabled: !!id,
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClassRequest) => classesService.createClass(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClassRequest }) =>
      classesService.updateClass(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["class", vars.id] });
    },
  });
}

export function useCreateClassReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, payload }: { classId: string; payload: CreateReviewRequest }) =>
      reviewsService.createClassReview(classId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["class", vars.classId] });
      qc.invalidateQueries({ queryKey: ["tutor-reviews"] });
    },
  });
}
