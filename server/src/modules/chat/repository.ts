import type Database from "better-sqlite3";
import type { ChatMessage } from "../../types/domain.js";

type ChatMessageRow = {
  id: number;
  doc_id: string;
  sender_name: string;
  message: string;
  sent_at: string;
};

export type CreateChatMessageInput = {
  docId: string;
  senderName: string;
  message: string;
  sentAt: string;
};

function mapChatMessageRow(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    docId: row.doc_id,
    senderName: row.sender_name,
    message: row.message,
    sentAt: row.sent_at
  };
}

export function createChatRepository(database: Database.Database) {
  const insertChatMessageStatement = database.prepare(`
    INSERT INTO chat_messages (
      doc_id,
      sender_name,
      message,
      sent_at
    ) VALUES (
      @docId,
      @senderName,
      @message,
      @sentAt
    )
  `);

  const selectRecentMessagesStatement = database.prepare(`
    SELECT
      id,
      doc_id,
      sender_name,
      message,
      sent_at
    FROM chat_messages
    WHERE doc_id = ?
    ORDER BY id DESC
    LIMIT ?
  `);

  return {
    createChatMessage(input: CreateChatMessageInput) {
      const result = insertChatMessageStatement.run(input);
      return {
        id: Number(result.lastInsertRowid),
        docId: input.docId,
        senderName: input.senderName,
        message: input.message,
        sentAt: input.sentAt
      } satisfies ChatMessage;
    },
    getRecentMessages(documentId: string, limit = 50) {
      const rows = selectRecentMessagesStatement.all(documentId, limit) as ChatMessageRow[];
      return rows.reverse().map(mapChatMessageRow);
    }
  };
}
