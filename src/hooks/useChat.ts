import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as chatService from "@/services/chat";

export function useClassMessages(classId: string | undefined) {
  const result = useQuery({
    queryKey: ["class-messages", classId],
    queryFn: () => chatService.getMessages(classId as string),
    enabled: !!classId,
  });
  return { ...result, messages: result.data ?? [] };
}

export function useSendMessage(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => chatService.sendMessage(classId, { message }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-messages", classId] }),
  });
}

export function useMarkMessagesRead(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => chatService.markMessagesRead(classId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-messages", classId] }),
  });
}
