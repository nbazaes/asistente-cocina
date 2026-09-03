import type { ChatHistoryMessage, Conversation } from '../../models';

export interface ChatHistoryDraftMessage {
  role: 'user' | 'assistant';
  content: string;
  imageDataUri?: string | null;
}

export interface ConversationSummary extends Conversation {
  messageCount: number;
}

export interface IChatHistoryRepository {
  listConversations(): Promise<ConversationSummary[]>;
  getLatestConversation(): Promise<Conversation | null>;
  getMessages(conversationId: string): Promise<ChatHistoryMessage[]>;
  createConversation(title: string): Promise<Conversation>;
  appendMessages(conversationId: string, messages: ChatHistoryDraftMessage[]): Promise<void>;
  deleteConversation(id: string): Promise<void>;
}