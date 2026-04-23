import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { Socket } from "socket.io";
import type {
  ChatSendPayload,
  ClientReconnectReadyPayload,
  DocumentSavedPayload,
  RoomJoinPayload,
  RoomLeavePayload,
  SocketClientToServerEvents,
  SocketServerToClientEvents,
  SystemEvent
} from "../types/domain.js";
import { createPresenceStore } from "../modules/presence/index.js";
import { getDataAccess } from "../services/data-access.js";
import { logger } from "../services/logger.js";
import { validateDocId, validateName } from "../services/validation.js";

type ServerSideSocket = Socket<
  SocketClientToServerEvents,
  SocketServerToClientEvents
>;

type SessionState = {
  docId: string;
  name: string;
};

const presenceStore = createPresenceStore();

function emitPresence(io: RealtimeServer, docId: string) {
  io.to(docId).emit("presence:update", presenceStore.getUsers(docId));
}

type RealtimeServer = Server<
  SocketClientToServerEvents,
  SocketServerToClientEvents
>;

function createSystemMessage(
  docId: string,
  eventType: SystemEvent["eventType"],
  payload: Record<string, unknown>,
  id = 0
): SystemEvent {
  return {
    id,
    docId,
    eventType,
    payloadJson: JSON.stringify(payload),
    createdAt: new Date().toISOString()
  };
}

function ensureDocumentExists(docId: string) {
  const document = getDataAccess().documents.getDocumentById(docId);
  return document && !document.isDeleted;
}

function persistSystemEvent(event: SystemEvent) {
  return getDataAccess().systemEvents.createSystemEvent({
    docId: event.docId,
    eventType: event.eventType,
    payloadJson: event.payloadJson,
    createdAt: event.createdAt
  });
}

function clearSocketSession(socket: ServerSideSocket) {
  const session = socket.data.session as SessionState | undefined;

  if (!session) {
    return null;
  }

  delete socket.data.session;
  return session;
}

function handleJoin(
  io: RealtimeServer,
  socket: ServerSideSocket,
  payload: RoomJoinPayload | ClientReconnectReadyPayload,
  isReconnect = false
) {
  const docId = validateDocId(payload.docId);
  const originalName = validateName(payload.name);
  const currentParticipant = presenceStore.getParticipantBySocketId(socket.id);
  const currentSession = socket.data.session as SessionState | undefined;

  if (!ensureDocumentExists(docId)) {
    logger.warn("Socket room join rejected because document does not exist", {
      module: "socket",
      event: isReconnect ? "client:reconnect-ready" : "room:join",
      docId
    });
    return;
  }

  if (
    currentParticipant &&
    currentSession &&
    currentParticipant.docId === docId &&
    currentSession.docId === docId &&
    (currentParticipant.baseName === originalName || currentParticipant.name === originalName)
  ) {
    socket.emit("room:joined", {
      docId,
      users: presenceStore.getUsers(docId)
    });

    logger.info("Socket duplicate join ignored", {
      module: "socket",
      event: isReconnect ? "client:reconnect-ready" : "room:join",
      docId,
      socketId: socket.id,
      name: currentParticipant.name
    });
    return;
  }

  const previousSession = clearSocketSession(socket);
  if (previousSession) {
    socket.leave(previousSession.docId);
    presenceStore.leaveBySocketId(socket.id);
    emitPresence(io, previousSession.docId);
  }

  const user = presenceStore.joinRoom(docId, originalName, socket.id);
  socket.join(docId);
  socket.data.session = { docId, name: user.name } satisfies SessionState;

  const systemEvent = isReconnect
    ? persistSystemEvent(
        createSystemMessage(docId, "reconnected", {
          name: user.name
        })
      )
    : persistSystemEvent(
        createSystemMessage(docId, "user_joined", {
          name: user.name
        })
      );

  emitPresence(io, docId);
  socket.emit("room:joined", {
    docId,
    users: presenceStore.getUsers(docId)
  });
  socket.to(docId).emit("system:new", systemEvent);

  logger.info(isReconnect ? "Socket client reconnected to room" : "Socket joined room", {
    module: "socket",
    event: isReconnect ? "client:reconnect-ready" : "room:join",
    docId,
    socketId: socket.id,
    name: user.name
  });
}

function handleLeave(io: RealtimeServer, socket: ServerSideSocket, payload?: RoomLeavePayload) {
  const participant = presenceStore.getParticipantBySocketId(socket.id);

  if (!participant) {
    return;
  }

  const requestedDocId = payload?.docId ? validateDocId(payload.docId) : participant.docId;

  if (requestedDocId !== participant.docId) {
    return;
  }

  const removed = presenceStore.leaveBySocketId(socket.id);
  clearSocketSession(socket);

  if (!removed) {
    return;
  }

  socket.leave(removed.docId);

  const systemEvent = persistSystemEvent(
    createSystemMessage(removed.docId, "user_left", {
      name: removed.name
    })
  );

  emitPresence(io, removed.docId);
  io.to(removed.docId).emit("system:new", systemEvent);

  logger.info("Socket left room", {
    module: "socket",
    event: "room:leave",
    docId: removed.docId,
    socketId: socket.id,
    name: removed.name
  });
}

function handleChat(io: RealtimeServer, socket: ServerSideSocket, payload: ChatSendPayload) {
  const participant = presenceStore.getParticipantBySocketId(socket.id);
  const docId = validateDocId(payload.docId);
  const message = payload.message.trim();

  if (!participant || participant.docId !== docId || !message) {
    logger.warn("Socket chat send rejected", {
      module: "socket",
      event: "chat:send",
      docId,
      socketId: socket.id
    });
    return;
  }

  try {
    const chatMessage = getDataAccess().chat.createChatMessage({
      docId,
      senderName: participant.name,
      message,
      sentAt: new Date().toISOString()
    });

    io.to(docId).emit("chat:new", chatMessage);
  } catch (error) {
    logger.error("Socket chat broadcast failed", {
      module: "socket",
      event: "chat:send",
      docId,
      socketId: socket.id,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

function handleDocumentSaved(
  io: RealtimeServer,
  socket: ServerSideSocket,
  payload: DocumentSavedPayload
) {
  const participant = presenceStore.getParticipantBySocketId(socket.id);
  const docId = validateDocId(payload.docId);
  const name = validateName(payload.name);

  if (!participant || participant.docId !== docId) {
    return;
  }

  const systemEvent = persistSystemEvent(
    createSystemMessage(docId, "document_saved", {
      name,
      snapshotVersion: payload.snapshotVersion
    })
  );

  io.to(docId).emit("document:saved:broadcast", {
    docId,
    name,
    snapshotVersion: payload.snapshotVersion
  });
  io.to(docId).emit("system:new", systemEvent);

  logger.info("Socket document saved broadcast emitted", {
    module: "socket",
    event: "document:saved",
    docId,
    socketId: socket.id,
    snapshotVersion: payload.snapshotVersion
  });
}

export function createRealtimeServer(httpServer: HttpServer) {
  const io: RealtimeServer = new Server(httpServer, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
    logger.info("Socket connected", {
      module: "socket",
      socketId: socket.id
    });

    socket.on("room:join", (payload) => {
      try {
        handleJoin(io, socket, payload, false);
      } catch (error) {
        logger.error("Socket room join failed", {
          module: "socket",
          event: "room:join",
          socketId: socket.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    socket.on("client:reconnect-ready", (payload) => {
      try {
        handleJoin(io, socket, payload, true);
      } catch (error) {
        logger.error("Socket reconnect handling failed", {
          module: "socket",
          event: "client:reconnect-ready",
          socketId: socket.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    socket.on("room:leave", (payload) => {
      try {
        handleLeave(io, socket, payload);
      } catch (error) {
        logger.error("Socket room leave failed", {
          module: "socket",
          event: "room:leave",
          socketId: socket.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    socket.on("chat:send", (payload) => {
      try {
        handleChat(io, socket, payload);
      } catch (error) {
        logger.error("Socket chat send failed", {
          module: "socket",
          event: "chat:send",
          socketId: socket.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    socket.on("document:saved", (payload) => {
      try {
        handleDocumentSaved(io, socket, payload);
      } catch (error) {
        logger.error("Socket document saved handling failed", {
          module: "socket",
          event: "document:saved",
          socketId: socket.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    socket.on("disconnect", () => {
      try {
        handleLeave(io, socket);
      } catch (error) {
        logger.error("Socket disconnect cleanup failed", {
          module: "socket",
          event: "disconnect",
          socketId: socket.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  });

  return io;
}
