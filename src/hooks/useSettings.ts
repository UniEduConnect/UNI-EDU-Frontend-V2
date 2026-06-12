import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as svc from "@/services/settings";
import type { SystemSettings } from "@/types/api";

export function useSettings() { return useQuery({ queryKey: ["settings"], queryFn: () => svc.getSettings() }); }
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p: Partial<SystemSettings>) => svc.updateSettings(p), onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }) });
}
