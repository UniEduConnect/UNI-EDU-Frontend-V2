import { apiClient } from "@/lib/apiClient";
import type {
  AvailableSlotDto,
  BankAccount,
  Paged,
  SaveBankAccountRequest,
  TutorListItem,
  TutorListQuery,
  TutorProfileResponse,
  TutorReviewItem,
  UpdateAvailabilityRequest,
  UpdateTutorProfileRequest,
} from "@/types/api";

export async function getTutors(query: TutorListQuery = {}): Promise<Paged<TutorListItem>> {
  return apiClient.get("/Tutors", { params: query }) as unknown as Promise<Paged<TutorListItem>>;
}

export async function getTutor(id: string): Promise<TutorProfileResponse> {
  return apiClient.get(`/Tutors/${id}`) as unknown as Promise<TutorProfileResponse>;
}

export async function getTutorReviews(id: string, page = 1): Promise<Paged<TutorReviewItem>> {
  return apiClient.get(`/Tutors/${id}/reviews`, { params: { Page: page } }) as unknown as Promise<
    Paged<TutorReviewItem>
  >;
}

export async function getTutorAvailability(id: string): Promise<AvailableSlotDto[]> {
  return apiClient.get(`/Tutors/${id}/availability`) as unknown as Promise<AvailableSlotDto[]>;
}

export async function updateMyAvailability(
  payload: UpdateAvailabilityRequest,
): Promise<AvailableSlotDto[]> {
  return apiClient.put("/Tutors/me/availability", payload) as unknown as Promise<AvailableSlotDto[]>;
}

// PUT /Tutors/me/profile — update the logged-in tutor's own profile.
export async function updateMyProfile(payload: UpdateTutorProfileRequest): Promise<unknown> {
  return apiClient.put("/Tutors/me/profile", payload) as unknown as Promise<unknown>;
}

export async function getMyBankAccount(): Promise<BankAccount | null> {
  return apiClient.get("/Tutors/me/bank-account") as unknown as Promise<BankAccount | null>;
}

export async function saveMyBankAccount(payload: SaveBankAccountRequest): Promise<BankAccount> {
  return apiClient.post("/Tutors/me/bank-account", payload) as unknown as Promise<BankAccount>;
}

export async function deleteMyBankAccount(): Promise<void> {
  await apiClient.delete("/Tutors/me/bank-account");
}
