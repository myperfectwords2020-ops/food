export type AiChatInput = {
  tenantId: string;
  conversationId: string;
  message: string;
  customerContext?: Record<string, unknown> | undefined;
};

export type AiChatResult = {
  text: string;
  toolCalls?: { name: string; arguments: Record<string, unknown> }[] | undefined;
};

/** Server-side only. Tools must map to controlled application APIs — never raw SQL/shell. */
export interface AIService {
  chat(input: AiChatInput): Promise<AiChatResult>;
}
