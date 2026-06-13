import { useQuery } from "@tanstack/react-query";
import { getPublicStats } from "@/services/stats";

export function usePublicStats() {
  return useQuery({ queryKey: ["public-stats"], queryFn: getPublicStats, staleTime: 5 * 60 * 1000 });
}
