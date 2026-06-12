import { apiClient } from "@/lib/apiClient";
import type { MessageResponse, SendMessageRequest } from "@/types/api";

export async function getMessages(classId: string): Promise<MessageResponse[]> {
  return apiClient.get(`/classes/${classId}/messages`) as unknown as Promise<MessageResponse[]>;
}

export async function sendMessage(classId: string, payload: SendMessageRequest): Promise<MessageResponse> {
  return apiClient.post(`/classes/${classId}/messages`, payload) as unknown as Promise<MessageResponse>;
}

export async function markMessagesRead(classId: string): Promise<unknown> {
  return apiClient.patch(`/classes/${classId}/messages/read`) as unknown as Promise<unknown>;
}

import type { ConversationItem } from "@/types/api";
export const getConversations = () =>
  apiClient.get("/me/conversations") as unknown as Promise<ConversationItem[]>;

/** POST /api/chat — public support assistant (AI with deterministic fallback). */
export const sendSupportChat = (message: string) =>
  apiClient.post("/chat", { message }) as unknown as Promise<{ reply: string }>;
