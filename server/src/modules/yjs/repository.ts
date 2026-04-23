import type Database from "better-sqlite3";
import type { DocumentState } from "../../types/domain.js";

type DocumentStateRow = {
  doc_id: string;
  yjs_state: Buffer;
  plain_text: string;
  markdown_text: string;
  state_revision: number;
  updated_at: string;
};

export type UpsertDocumentStateInput = {
  docId: string;
  yjsState: Uint8Array;
  plainText: string;
  markdownText: string;
  stateRevision: number;
  updatedAt: string;
};

function mapDocumentStateRow(row: DocumentStateRow): DocumentState {
  return {
    docId: row.doc_id,
    yjsState: new Uint8Array(row.yjs_state),
    plainText: row.plain_text,
    markdownText: row.markdown_text,
    stateRevision: row.state_revision,
    updatedAt: row.updated_at
  };
}

export function createYjsRepository(database: Database.Database) {
  const selectDocumentStateStatement = database.prepare(`
    SELECT
      doc_id,
      yjs_state,
      plain_text,
      markdown_text,
      state_revision,
      updated_at
    FROM document_states
    WHERE doc_id = ?
  `);

  const upsertDocumentStateStatement = database.prepare(`
    INSERT INTO document_states (
      doc_id,
      yjs_state,
      plain_text,
      markdown_text,
      state_revision,
      updated_at
    ) VALUES (
      @docId,
      @yjsState,
      @plainText,
      @markdownText,
      @stateRevision,
      @updatedAt
    )
    ON CONFLICT(doc_id) DO UPDATE SET
      yjs_state = excluded.yjs_state,
      plain_text = excluded.plain_text,
      markdown_text = excluded.markdown_text,
      state_revision = excluded.state_revision,
      updated_at = excluded.updated_at
  `);

  return {
    getDocumentState(documentId: string) {
      const row = selectDocumentStateStatement.get(documentId) as
        | DocumentStateRow
        | undefined;

      return row ? mapDocumentStateRow(row) : null;
    },
    upsertDocumentState(input: UpsertDocumentStateInput) {
      upsertDocumentStateStatement.run({
        docId: input.docId,
        yjsState: Buffer.from(input.yjsState),
        plainText: input.plainText,
        markdownText: input.markdownText,
        stateRevision: input.stateRevision,
        updatedAt: input.updatedAt
      });

      return {
        docId: input.docId,
        yjsState: input.yjsState,
        plainText: input.plainText,
        markdownText: input.markdownText,
        stateRevision: input.stateRevision,
        updatedAt: input.updatedAt
      } satisfies DocumentState;
    }
  };
}
