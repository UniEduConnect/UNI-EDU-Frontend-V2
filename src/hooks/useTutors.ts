import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as tutorsService from "@/services/tutors";
import { useAuth } from "@/contexts/AuthContext";
import type {
  SaveBankAccountRequest,
  TutorListItem,
  TutorListQuery,
  UpdateAvailabilityRequest,
  UpdateTutorProfileRequest,
} from "@/types/api";

/**
 * Fetches the tutor list from the backend. Filtering/pagination in the
 * find-tutor pages is done client-side over the returned array, so we just
 * fetch the list here (server-side query params are optional).
 */
export function useTutors(query: TutorListQuery = {}) {
  const result = useQuery({
    queryKey: ["tutors", query],
    queryFn: () => tutorsService.getTutors(query),
    staleTime: 60_000,
  });
  const tutors: TutorListItem[] = result.data?.items ?? [];
  return { ...result, tutors };
}

export function useTutor(id: string | undefined) {
  return useQuery({
    queryKey: ["tutor", id],
    queryFn: () => tutorsService.getTutor(id as string),
    enabled: !!id,
  });
}

/** The logged-in tutor's own full profile (GET /Tutors/{myId} → TutorProfileResponse). */
export function useMyTutorProfile() {
  const { user } = useAuth();
  return useTutor(user?.id);
}

export function useTutorReviews(id: string | undefined, page = 1) {
  return useQuery({
    queryKey: ["tutor-reviews", id, page],
    queryFn: () => tutorsService.getTutorReviews(id as string, page),
    enabled: !!id,
  });
}

/** Reviews for the logged-in tutor (richer TutorReviewItem via /Tutors/{myId}/reviews). */
export function useMyReviews(page = 1) {
  const { user } = useAuth();
  return useTutorReviews(user?.id, page);
}

/** PUT /Tutors/me/profile — update the logged-in tutor's profile. */
export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTutorProfileRequest) => tutorsService.updateMyProfile(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutor"] });
      qc.invalidateQueries({ queryKey: ["dash-tutor"] });
    },
  });
}

export function useTutorAvailability(id: string | undefined) {
  return useQuery({
    queryKey: ["tutor-availability", id],
    queryFn: () => tutorsService.getTutorAvailability(id as string),
    enabled: !!id,
  });
}

export function useUpdateMyAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAvailabilityRequest) => tutorsService.updateMyAvailability(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tutor-availability"] }),
  });
}

// --- Tutor's own bank account (role: Tutor) ---
export function useMyBankAccount() {
  return useQuery({
    queryKey: ["my-bank-account"],
    queryFn: () => tutorsService.getMyBankAccount(),
  });
}

export function useSaveMyBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveBankAccountRequest) => tutorsService.saveMyBankAccount(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-bank-account"] }),
  });
}

export function useDeleteMyBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => tutorsService.deleteMyBankAccount(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-bank-account"] }),
  });
}
