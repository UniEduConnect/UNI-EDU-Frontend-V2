import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as svc from "@/services/reviews";

/** GET /Reviews — moderation list (Admin/Office). */
export function useReviewsForModeration(params: { Status?: string; Page?: number } = {}) {
  const r = useQuery({ queryKey: ["reviews-moderation", params], queryFn: () => svc.getReviewsForModeration(params) });
  return { ...r, reviews: r.data?.items ?? [] };
}
function useInv() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["reviews-moderation"] });
}
export function useHideReview() {
  const inv = useInv();
  return useMutation({ mutationFn: (id: number) => svc.hideReview(id), onSuccess: inv });
}
export function useUnhideReview() {
  const inv = useInv();
  return useMutation({ mutationFn: (id: number) => svc.unhideReview(id), onSuccess: inv });
}
