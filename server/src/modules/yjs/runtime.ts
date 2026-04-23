import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import WebSocket, { WebSocketServer } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import type { RawData } from "ws";
import type { DocumentState } from "../../types/domain.js";
import { HttpError } from "../../services/http-errors.js";
import { getDataAccess } from "../../services/data-access.js";
import { logger } from "../../services/logger.js";

export const YJS_WEBSOCKET_PATH = "/yjs";
const YJS_TEXT_KEY = "content";
const YJS_PERSIST_DEBOUNCE_MS = 2000;
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;
const WS_READY_STATE_CONNECTING = 0;
const WS_READY_STATE_OPEN = 1;
const PING_TIMEOUT_MS = 30000;

type PersistenceReason = "auto" | "manual" | "disconnect";

export class RuntimeYjsDocument extends Y.Doc {
  readonly docId: string;
  readonly awareness: awarenessProtocol.Awareness;
  readonly conns: Map<WebSocket, Set<number>>;
  readonly text: Y.Text;
  stateRevision: number;
  updatedAt: string;
  lastPersistedText: string;
  persistTimer: NodeJS.Timeout | null;

  constructor(docId: string) {
    super();
    this.docId = docId;
    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);
    this.conns = new Map();
    this.text = this.getText(YJS_TEXT_KEY);
    this.stateRevision = 0;
    this.updatedAt = new Date().toISOString();
    this.lastPersistedText = "";
    this.persistTimer = null;
  }
}

const runtimeDocs = new Map<string, RuntimeYjsDocument>();

function emptyState(docId: string, updatedAt: string): DocumentState {
  return {
    docId,
    yjsState: new Uint8Array(),
    plainText: "",
    markdownText: "",
    stateRevision: 0,
    updatedAt
  };
}

function ensureDocumentExists(docId: string) {
  const document = getDataAccess().documents.getDocumentById(docId);

  if (!document || document.isDeleted) {
    throw new HttpError(404, "Document not found.");
  }

  return document;
}

function getOrCreatePersistedState(docId: string) {
  const existing = getDataAccess().yjs.getDocumentState(docId);

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  return getDataAccess().yjs.upsertDocumentState(emptyState(docId, now));
}

function encodeCurrentState(doc: RuntimeYjsDocument) {
  return Y.encodeStateAsUpdate(doc);
}

function buildCurrentState(doc: RuntimeYjsDocument): DocumentState {
  const textContent = doc.text.toString();

  return {
    docId: doc.docId,
    yjsState: encodeCurrentState(doc),
    plainText: textContent,
    markdownText: textContent,
    stateRevision: doc.stateRevision,
    updatedAt: doc.updatedAt
  };
}

function persistRuntimeDocument(
  doc: RuntimeYjsDocument,
  reason: PersistenceReason,
  force: boolean
) {
  const currentText = doc.text.toString();

  if (!force && currentText === doc.lastPersistedText) {
    return null;
  }

  const nextStateRevision = doc.stateRevision + 1;
  const updatedAt = new Date().toISOString();

  try {
    const savedState = getDataAccess().yjs.upsertDocumentState({
      docId: doc.docId,
      yjsState: encodeCurrentState(doc),
      plainText: currentText,
      markdownText: currentText,
      stateRevision: nextStateRevision,
      updatedAt
    });

    doc.stateRevision = savedState.stateRevision;
    doc.updatedAt = savedState.updatedAt;
    doc.lastPersistedText = savedState.plainText;

    logger.info("Yjs state persisted", {
      module: "yjs",
      docId: doc.docId,
      reason,
      stateRevision: savedState.stateRevision
    });

    return savedState;
  } catch (error) {
    logger.error("Yjs persistence failed", {
      module: "yjs",
      docId: doc.docId,
      reason,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

function clearPersistTimer(doc: RuntimeYjsDocument) {
  if (doc.persistTimer) {
    clearTimeout(doc.persistTimer);
    doc.persistTimer = null;
  }
}

function schedulePersist(doc: RuntimeYjsDocument) {
  clearPersistTimer(doc);
  doc.persistTimer = setTimeout(() => {
    doc.persistTimer = null;

    try {
      persistRuntimeDocument(doc, "auto", false);
    } catch {
      // persistence errors are already logged; keep the room alive
    }
  }, YJS_PERSIST_DEBOUNCE_MS);
}

function send(doc: RuntimeYjsDocument, conn: WebSocket, message: Uint8Array) {
  if (
    conn.readyState !== WS_READY_STATE_CONNECTING &&
    conn.readyState !== WS_READY_STATE_OPEN
  ) {
    closeConnection(doc, conn);
    return;
  }

  try {
    conn.send(message, {}, (error) => {
      if (error) {
        closeConnection(doc, conn);
      }
    });
  } catch {
    closeConnection(doc, conn);
  }
}

function createAwarenessHandler(doc: RuntimeYjsDocument) {
  return (
    {
      added,
      updated,
      removed
    }: {
      added: number[];
      updated: number[];
      removed: number[];
    },
    conn: WebSocket | null
  ) => {
    const changedClients = added.concat(updated, removed);

    if (conn !== null) {
      const controlledIds = doc.conns.get(conn);
      if (controlledIds) {
        added.forEach((clientId) => controlledIds.add(clientId));
        removed.forEach((clientId) => controlledIds.delete(clientId));
      }
    }

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(doc.awareness, changedClients)
    );
    const message = encoding.toUint8Array(encoder);

    doc.conns.forEach((_, connection) => {
      send(doc, connection, message);
    });
  };
}

function createUpdateHandler(doc: RuntimeYjsDocument) {
  return (update: Uint8Array) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);

    doc.conns.forEach((_, conn) => {
      send(doc, conn, message);
    });

    schedulePersist(doc);
  };
}

function restoreRuntimeDocument(docId: string) {
  const existing = runtimeDocs.get(docId);
  if (existing) {
    return existing;
  }

  ensureDocumentExists(docId);

  const persistedState = getOrCreatePersistedState(docId);
  const runtimeDoc = new RuntimeYjsDocument(docId);

  if (persistedState.yjsState.length > 0) {
    Y.applyUpdate(runtimeDoc, persistedState.yjsState, "database-restore");
  }

  runtimeDoc.stateRevision = persistedState.stateRevision;
  runtimeDoc.updatedAt = persistedState.updatedAt;
  runtimeDoc.lastPersistedText = persistedState.plainText;
  runtimeDoc.awareness.on("update", createAwarenessHandler(runtimeDoc));
  runtimeDoc.on("update", createUpdateHandler(runtimeDoc));
  runtimeDocs.set(docId, runtimeDoc);

  logger.info(
    persistedState.yjsState.length > 0
      ? "Yjs state restored from database"
      : "Yjs runtime document initialized",
    {
      module: "yjs",
      docId,
      stateRevision: persistedState.stateRevision
    }
  );

  return runtimeDoc;
}

function readMessageData(message: RawData) {
  if (message instanceof ArrayBuffer) {
    return new Uint8Array(message);
  }

  if (Array.isArray(message)) {
    const totalLength = message.reduce((sum, chunk) => sum + chunk.length, 0);
    const joined = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of message) {
      joined.set(chunk, offset);
      offset += chunk.length;
    }

    return joined;
  }

  return new Uint8Array(message);
}

function messageListener(conn: WebSocket, doc: RuntimeYjsDocument, message: Uint8Array) {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case MESSAGE_SYNC:
        encoding.writeVarUint(encoder, MESSAGE_SYNC);
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn);

        if (encoding.length(encoder) > 1) {
          send(doc, conn, encoding.toUint8Array(encoder));
        }
        break;
      case MESSAGE_AWARENESS:
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;
      default:
        break;
    }
  } catch (error) {
    logger.error("Yjs websocket message handling failed", {
      module: "yjs",
      docId: doc.docId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

function closeConnection(doc: RuntimeYjsDocument, conn: WebSocket) {
  if (!doc.conns.has(conn)) {
    if (
      conn.readyState === WS_READY_STATE_CONNECTING ||
      conn.readyState === WS_READY_STATE_OPEN
    ) {
      conn.close();
    }
    return;
  }

  const controlledIds = doc.conns.get(conn) ?? new Set<number>();
  doc.conns.delete(conn);
  awarenessProtocol.removeAwarenessStates(
    doc.awareness,
    Array.from(controlledIds),
    null
  );

  if (doc.conns.size === 0) {
    clearPersistTimer(doc);
    try {
      persistRuntimeDocument(doc, "disconnect", false);
    } catch {
      // persistence errors are already logged
    }
  }

  if (
    conn.readyState === WS_READY_STATE_CONNECTING ||
    conn.readyState === WS_READY_STATE_OPEN
  ) {
    conn.close();
  }
}

function writeInitialSync(doc: RuntimeYjsDocument, conn: WebSocket) {
  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(syncEncoder, doc);
  send(doc, conn, encoding.toUint8Array(syncEncoder));

  const awarenessStates = doc.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        doc.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    send(doc, conn, encoding.toUint8Array(awarenessEncoder));
  }
}

export function getOrCreateRuntimeDocument(docId: string) {
  return restoreRuntimeDocument(docId);
}

export function getCurrentDocumentState(docId: string) {
  const runtimeDoc = runtimeDocs.get(docId);
  if (runtimeDoc) {
    return buildCurrentState(runtimeDoc);
  }

  return getDataAccess().yjs.getDocumentState(docId);
}

export function forcePersistDocumentState(docId: string) {
  const runtimeDoc = restoreRuntimeDocument(docId);
  clearPersistTimer(runtimeDoc);
  return (
    persistRuntimeDocument(runtimeDoc, "manual", true) ?? buildCurrentState(runtimeDoc)
  );
}

export function replaceDocumentTextForTesting(docId: string, content: string) {
  const runtimeDoc = restoreRuntimeDocument(docId);

  runtimeDoc.transact(() => {
    runtimeDoc.text.delete(0, runtimeDoc.text.length);
    if (content) {
      runtimeDoc.text.insert(0, content);
    }
  }, "test-text-replace");

  clearPersistTimer(runtimeDoc);
  return runtimeDoc.text.toString();
}

export function clearYjsRuntimeDocuments() {
  runtimeDocs.forEach((doc) => {
    clearPersistTimer(doc);
    doc.awareness.destroy();
    doc.destroy();
  });
  runtimeDocs.clear();
}

export function setupYjsConnection(conn: WebSocket, docId: string) {
  const doc = restoreRuntimeDocument(docId);
  conn.binaryType = "arraybuffer";
  doc.conns.set(conn, new Set());

  logger.info("Yjs client connected to document", {
    module: "yjs",
    docId,
    connectionCount: doc.conns.size
  });

  conn.on("message", (message) => {
    messageListener(conn, doc, readMessageData(message));
  });

  let pongReceived = true;
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      closeConnection(doc, conn);
      clearInterval(pingInterval);
      return;
    }

    if (doc.conns.has(conn)) {
      pongReceived = false;
      try {
        conn.ping();
      } catch {
        closeConnection(doc, conn);
        clearInterval(pingInterval);
      }
    }
  }, PING_TIMEOUT_MS);

  conn.on("close", () => {
    closeConnection(doc, conn);
    clearInterval(pingInterval);
  });

  conn.on("pong", () => {
    pongReceived = true;
  });

  writeInitialSync(doc, conn);
}

function getRequestDocId(request: IncomingMessage) {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  if (!pathname.startsWith(`${YJS_WEBSOCKET_PATH}/`)) {
    return null;
  }

  return decodeURIComponent(pathname.slice(`${YJS_WEBSOCKET_PATH}/`.length));
}

export function createYjsWebSocketServer() {
  return new WebSocketServer({
    noServer: true
  });
}

export function handleYjsUpgrade(
  wss: WebSocketServer,
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer
) {
  const docId = getRequestDocId(request);
  if (!docId) {
    return false;
  }

  try {
    ensureDocumentExists(docId);
  } catch (error) {
    logger.warn("Yjs websocket upgrade rejected", {
      module: "yjs",
      docId,
      error: error instanceof Error ? error.message : String(error)
    });
    socket.destroy();
    return true;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    setupYjsConnection(ws, docId);
  });

  return true;
}
