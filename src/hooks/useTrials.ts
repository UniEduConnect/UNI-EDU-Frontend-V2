import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as svc from "@/services/trials";
import type { CreateTrialRequest } from "@/types/api";

export function useTrials(params: { Status?: string; Page?: number } = {}) {
  const result = useQuery({ queryKey: ["trials", params], queryFn: () => svc.getTrials(params) });
  return { ...result, trials: result.data?.items ?? [] };
}
function useInv() { const qc = useQueryClient(); return () => qc.invalidateQueries({ queryKey: ["trials"] }); }
export function useCreateTrial() { const inv = useInv(); return useMutation({ mutationFn: (p: CreateTrialRequest) => svc.createTrial(p), onSuccess: inv }); }
export function useAcceptTrial() { const inv = useInv(); return useMutation({ mutationFn: (id: string) => svc.acceptTrial(id), onSuccess: inv }); }
export function useRejectTrial() { const inv = useInv(); return useMutation({ mutationFn: ({ id, note }: { id: string; note?: string }) => svc.rejectTrial(id, note), onSuccess: inv }); }
export function useCompleteTrial() { const inv = useInv(); return useMutation({ mutationFn: ({ id, feedback, rating }: { id: string; feedback?: string; rating?: number }) => svc.completeTrial(id, { feedback, rating }), onSuccess: inv }); }
