import { useQuery } from "@tanstack/react-query";
import * as subjectsService from "@/services/subjects";

export function useSubjects() {
  const result = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsService.getSubjects(),
    staleTime: 5 * 60_000,
  });
  return { ...result, subjects: result.data ?? [] };
}
