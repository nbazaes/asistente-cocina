import { eq, and, desc, notInArray, sql } from 'drizzle-orm';
import { db } from '../../database';
import { chatConversations, chatMessages } from '../../database/schema';
import type {
  IChatHistoryRepository,
  ChatHistoryDraftMessage,
  ConversationSummary,
} from '../interfaces/IChatHistoryRepository';
import type { ChatHistoryMessage, Conversation } from '../../models';
import { generateId } from './helpers';

const MAX_CONVERSATIONS = 10;
const MAX_MESSAGES_PER_CONVERSATION = 20;

function toConversation(row: {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}): Conversation {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class LocalChatHistoryRepository implements IChatHistoryRepository {
  async listConversations(): Promise<ConversationSummary[]> {
    const rows = await db
      .select({
        id: chatConversations.id,
        title: chatConversations.title,
        createdAt: chatConversations.createdAt,
        updatedAt: chatConversations.updatedAt,
        messageCount: sql<number>`count(${chatMessages.id})`,
      })
      .from(chatConversations)
      .leftJoin(chatMessages, eq(chatConversations.id, chatMessages.conversationId))
      .groupBy(chatConversations.id)
      .orderBy(desc(chatConversations.updatedAt));
    return rows.map((r) => ({
      ...toConversation(r),
      messageCount: Number(r.messageCount),
    }));
  }

  async getLatestConversation(): Promise<Conversation | null> {
    const rows = await db
      .select()
      .from(chatConversations)
      .orderBy(desc(chatConversations.updatedAt))
      .limit(1);
    return rows.length > 0 ? toConversation(rows[0]) : null;
  }

  async getMessages(conversationId: string): Promise<ChatHistoryMessage[]> {
    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.position);
    return rows.map((row) => ({
      id: row.id,
      conversationId: row.conversationId,
      role: row.role === 'user' ? 'user' as const : 'assistant' as const,
      content: row.content,
      imageDataUri: row.imageDataUri,
      createdAt: row.createdAt,
      position: row.position,
    }));
  }

  async createConversation(title: string): Promise<Conversation> {
    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: generateId(),
      title: title || 'Conversación',
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(chatConversations).values(conversation);
    await this.pruneConversations();
    return conversation;
  }

  async appendMessages(conversationId: string, messages: ChatHistoryDraftMessage[]): Promise<void> {
    if (messages.length === 0) return;

    const now = new Date().toISOString();
    const maxPosRows = await db
      .select({ max: sql<number>`max(${chatMessages.position})` })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId));
    const maxPos = maxPosRows[0]?.max ?? 0;

    const values = messages.map((m, i) => ({
      id: generateId(),
      conversationId,
      role: m.role,
      content: m.content,
      imageDataUri: m.imageDataUri ?? null,
      createdAt: now,
      position: maxPos + i + 1,
    }));

    await db.insert(chatMessages).values(values);

    await db
      .update(chatConversations)
      .set({ updatedAt: now })
      .where(eq(chatConversations.id, conversationId));

    await this.pruneMessages(conversationId);
  }

  async deleteConversation(id: string): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.conversationId, id));
    await db.delete(chatConversations).where(eq(chatConversations.id, id));
  }

  private async pruneConversations(): Promise<void> {
    const rows = await db
      .select({ id: chatConversations.id })
      .from(chatConversations)
      .orderBy(desc(chatConversations.updatedAt));
    if (rows.length <= MAX_CONVERSATIONS) return;
    const toDelete = rows.slice(MAX_CONVERSATIONS).map((r) => r.id);
    for (const id of toDelete) {
      await db.delete(chatMessages).where(eq(chatMessages.conversationId, id));
      await db.delete(chatConversations).where(eq(chatConversations.id, id));
    }
  }

  private async pruneMessages(conversationId: string): Promise<void> {
    const rows = await db
      .select({ position: chatMessages.position })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(desc(chatMessages.position))
      .limit(MAX_MESSAGES_PER_CONVERSATION);
    if (rows.length < MAX_MESSAGES_PER_CONVERSATION) return;
    const keep = rows.map((r) => r.position);
    await db
      .delete(chatMessages)
      .where(
        and(
          eq(chatMessages.conversationId, conversationId),
          notInArray(chatMessages.position, keep),
        ),
      );
  }
}