import { apiClient } from "@/lib/apiClient";

export interface PublicStats {
  tutors: number;
  students: number;
  classes: number;
  sessionsCompleted: number;
  satisfactionPct: number;
}

/** GET /api/stats — public landing-page metrics. */
export const getPublicStats = () => apiClient.get("/stats") as unknown as Promise<PublicStats>;
