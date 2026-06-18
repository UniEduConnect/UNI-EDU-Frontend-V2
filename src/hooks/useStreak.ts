import { useQuery } from "@tanstack/react-query";
import * as svc from "@/services/streak";

/**
 * Learning-streak hook for the student dashboard. Opening the dashboard counts as
 * the day's activity, so the query's fetcher is the check-in call (idempotent per
 * day on the server) — it records "active today" and returns the updated streak.
 * `staleTime` keeps a single check-in per session instead of firing on every refocus.
 */
export const useStreak = () =>
  useQuery({
    queryKey: ["streak"],
    queryFn: svc.checkInStreak,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
