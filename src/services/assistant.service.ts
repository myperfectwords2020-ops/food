import type {
  AssistantConversationStart,
  AssistantCustomerContext,
  AssistantSendMessageRequest,
  AssistantSendMessageResult,
} from "@/types/assistant";

export interface AssistantService {
  startConversation(context?: AssistantCustomerContext): Promise<AssistantConversationStart>;
  sendMessage(request: AssistantSendMessageRequest): Promise<AssistantSendMessageResult>;
}
