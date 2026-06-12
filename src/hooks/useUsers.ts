import { useMutation, useQuery } from "@tanstack/react-query";
import * as usersService from "@/services/users";
import type { CheckPhoneUserRequest } from "@/types/api";

/** Mutation form — call `.mutateAsync({ phoneNumber })` during registration. */
export function useCheckPhone() {
  return useMutation({
    mutationFn: (payload: CheckPhoneUserRequest) => usersService.checkPhone(payload),
  });
}

/** GET /Users/me — current authenticated user (name/avatar/role for layouts). */
export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => usersService.getMe() });
}
