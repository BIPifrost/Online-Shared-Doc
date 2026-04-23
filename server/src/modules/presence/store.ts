import { nanoid } from "nanoid";
import type { PresenceUser } from "../../types/domain.js";

const COLOR_POOL = [
  "#0ea5e9",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
  "#ef4444",
  "#22c55e",
  "#eab308",
  "#06b6d4"
] as const;

type RoomParticipant = PresenceUser & {
  socketId: string;
  docId: string;
  baseName: string;
};

type RoomState = {
  participants: RoomParticipant[];
  nameCounters: Map<string, number>;
};

function normalizeName(name: string) {
  return name.trim();
}

function hashName(name: string) {
  let hash = 0;

  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function getColorForName(name: string) {
  return COLOR_POOL[hashName(name) % COLOR_POOL.length];
}

function toPresenceUser(participant: RoomParticipant): PresenceUser {
  return {
    clientId: participant.clientId,
    name: participant.name,
    color: participant.color,
    online: participant.online,
    joinedAt: participant.joinedAt
  };
}

export function createPresenceStore() {
  const rooms = new Map<string, RoomState>();
  const socketIndex = new Map<string, RoomParticipant>();

  function getOrCreateRoom(docId: string) {
    const existing = rooms.get(docId);

    if (existing) {
      return existing;
    }

    const room: RoomState = {
      participants: [],
      nameCounters: new Map()
    };

    rooms.set(docId, room);
    return room;
  }

  function cleanupRoom(docId: string) {
    const room = rooms.get(docId);

    if (room && room.participants.length === 0) {
      rooms.delete(docId);
    }
  }

  return {
    joinRoom(docId: string, rawName: string, socketId: string) {
      const room = getOrCreateRoom(docId);
      const baseName = normalizeName(rawName);
      const nextSequence = (room.nameCounters.get(baseName) ?? 0) + 1;
      room.nameCounters.set(baseName, nextSequence);

      const participant: RoomParticipant = {
        socketId,
        docId,
        clientId: nanoid(),
        baseName,
        name: nextSequence === 1 ? baseName : `${baseName}#${nextSequence}`,
        color: getColorForName(baseName),
        online: true,
        joinedAt: new Date().toISOString()
      };

      room.participants.push(participant);
      socketIndex.set(socketId, participant);

      return toPresenceUser(participant);
    },
    leaveBySocketId(socketId: string) {
      const participant = socketIndex.get(socketId);

      if (!participant) {
        return null;
      }

      const room = rooms.get(participant.docId);

      if (room) {
        room.participants = room.participants.filter(
          (candidate) => candidate.socketId !== socketId
        );
      }

      socketIndex.delete(socketId);
      cleanupRoom(participant.docId);

      return participant;
    },
    getUsers(docId: string) {
      const room = rooms.get(docId);
      if (!room) {
        return [];
      }

      return room.participants.map(toPresenceUser);
    },
    getParticipantBySocketId(socketId: string) {
      return socketIndex.get(socketId) ?? null;
    }
  };
}

export type PresenceStore = ReturnType<typeof createPresenceStore>;
