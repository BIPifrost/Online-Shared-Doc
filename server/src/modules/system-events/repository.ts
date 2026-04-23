import type Database from "better-sqlite3";
import type { SystemEvent, SystemEventType } from "../../types/domain.js";

type SystemEventRow = {
  id: number;
  doc_id: string;
  event_type: SystemEventType;
  payload_json: string;
  created_at: string;
};

export type CreateSystemEventInput = {
  docId: string;
  eventType: SystemEventType;
  payloadJson: string;
  createdAt: string;
};

function mapSystemEventRow(row: SystemEventRow): SystemEvent {
  return {
    id: row.id,
    docId: row.doc_id,
    eventType: row.event_type,
    payloadJson: row.payload_json,
    createdAt: row.created_at
  };
}

export function createSystemEventsRepository(database: Database.Database) {
  const insertSystemEventStatement = database.prepare(`
    INSERT INTO system_events (
      doc_id,
      event_type,
      payload_json,
      created_at
    ) VALUES (
      @docId,
      @eventType,
      @payloadJson,
      @createdAt
    )
  `);

  const selectSystemEventsStatement = database.prepare(`
    SELECT
      id,
      doc_id,
      event_type,
      payload_json,
      created_at
    FROM system_events
    WHERE doc_id = ?
    ORDER BY id DESC
    LIMIT ?
  `);

  return {
    createSystemEvent(input: CreateSystemEventInput) {
      const result = insertSystemEventStatement.run(input);
      return {
        id: Number(result.lastInsertRowid),
        docId: input.docId,
        eventType: input.eventType,
        payloadJson: input.payloadJson,
        createdAt: input.createdAt
      } satisfies SystemEvent;
    },
    getRecentSystemEvents(documentId: string, limit = 50) {
      const rows = selectSystemEventsStatement.all(documentId, limit) as SystemEventRow[];
      return rows.reverse().map(mapSystemEventRow);
    }
  };
}
