import { useQuery } from "@tanstack/react-query";
import { getMySessions } from "@/services/sessions";

export function useMySchedule(params: { from?: string; to?: string } = {}) {
  const result = useQuery({ queryKey: ["my-sessions", params], queryFn: () => getMySessions(params) });
  return { ...result, sessions: result.data ?? [] };
}
