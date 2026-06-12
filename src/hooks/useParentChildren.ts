import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as parentsService from "@/services/parents";
import { getParentReport } from "@/services/reports";

export function useParentChildren(options: { enabled?: boolean } = {}) {
  const result = useQuery({
    queryKey: ["parent-children"],
    queryFn: () => parentsService.getMyChildren(),
    retry: false, // currently 403s due to the backend role bug — don't hammer it
    enabled: options.enabled ?? true, // skip the call entirely for non-parents
  });
  const children = result.data ?? [];
  return { ...result, children };
}

/** GET /Parents/me/report — { childrenCount, activeClasses, totalSpent, avgChildScore }. */
export function useParentReport() {
  return useQuery({ queryKey: ["parent-report"], queryFn: () => getParentReport() });
}

/** GET /Parents/me/children/{childId}/progress — monthly + per-subject analytics. */
export function useChildProgress(childId: string | undefined) {
  return useQuery({
    queryKey: ["child-progress", childId],
    queryFn: () => parentsService.getChildProgress(childId as string),
    enabled: !!childId,
  });
}

/** GET /Parents/me/children/{childId}/exams — a child's exam results. */
export function useChildExams(childId: string | undefined, page = 1) {
  const result = useQuery({
    queryKey: ["child-exams", childId, page],
    queryFn: () => parentsService.getChildExams(childId as string, page),
    enabled: !!childId,
  });
  return { ...result, submissions: result.data?.items ?? [] };
}

/** POST /Parents/me/children/link — request to link a child by email (student must confirm). */
export function useLinkChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (childEmail: string) => parentsService.linkChild(childEmail),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parent-children"] }),
  });
}

/** POST /Parents/me/children/{childId}/fund — top up a child's wallet from the parent's wallet. */
export function useFundChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ childId, amount }: { childId: string; amount: number }) =>
      parentsService.fundChild(childId, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });
}
