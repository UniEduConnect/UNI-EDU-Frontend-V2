import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/services/chat";

export function useConversations() {
  const result = useQuery({ queryKey: ["conversations"], queryFn: () => getConversations() });
  return { ...result, conversations: result.data ?? [] };
}
