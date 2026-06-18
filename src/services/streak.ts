import { apiClient } from "@/lib/apiClient";
import type { StreakResponse } from "@/types/api";

/** Read the current learning streak without recording activity. */
export const getStreak = () =>
  apiClient.get("/Students/me/streak") as unknown as Promise<StreakResponse>;

/** Record today's activity and return the updated streak (idempotent per day). */
export const checkInStreak = () =>
  apiClient.post("/Students/me/streak/checkin") as unknown as Promise<StreakResponse>;
