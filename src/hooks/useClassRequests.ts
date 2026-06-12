import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as svc from "@/services/classRequests";
import type { AcceptClassRequestRequest, ClassRequestListQuery, CreateClassRequestRequest } from "@/types/api";

/** Open student requests a tutor can accept ("find students"). */
export function useOpenClassRequests(query: ClassRequestListQuery = {}) {
  const result = useQuery({
    queryKey: ["class-requests-open", query],
    queryFn: () => svc.getOpenClassRequests(query),
  });
  return { ...result, requests: result.data?.items ?? [] };
}

/** A student's own posted requests. */
export function useMyClassRequests() {
  const result = useQuery({ queryKey: ["class-requests-mine"], queryFn: () => svc.getMyClassRequests() });
  return { ...result, requests: result.data ?? [] };
}

export function useCreateClassRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClassRequestRequest) => svc.createClassRequest(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-requests-mine"] }),
  });
}

export function useAcceptClassRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AcceptClassRequestRequest }) =>
      svc.acceptClassRequest(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-requests-open"] });
      qc.invalidateQueries({ queryKey: ["my-submissions"] });
    },
  });
}
