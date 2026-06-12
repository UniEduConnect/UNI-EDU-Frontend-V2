import { useMutation } from "@tanstack/react-query";
import * as otpService from "@/services/otp";

/** POST /otp/send — email a 6-digit verification code. */
export function useSendOtp() {
  return useMutation({ mutationFn: (email: string) => otpService.sendOtp(email) });
}

/** POST /otp/verify — verify the code. Rejects on wrong/expired code. */
export function useVerifyOtp() {
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => otpService.verifyOtp(email, code),
  });
}
