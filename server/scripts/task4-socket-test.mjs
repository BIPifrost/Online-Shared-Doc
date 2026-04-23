import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { io as createClient } from "socket.io-client";
import { initializeDatabase, closeDatabase } from "../dist/db/index.js";
import { createBackendServer } from "../dist/app/createBackendServer.js";
import { clearYjsRuntimeDocuments } from "../dist/modules/yjs/runtime.js";
import { getDataAccess } from "../dist/services/data-access.js";

const tempDbPath = path.resolve("data/task4-test.db");
process.env.APP_DB_PATH = tempDbPath;
process.env.NODE_ENV = "test";

if (fs.existsSync(tempDbPath)) {
  fs.unlinkSync(tempDbPath);
}

initializeDatabase();
clearYjsRuntimeDocuments();

const dataAccess = getDataAccess();
const document = dataAccess.documents.createDocument({
  createdByName: "socket-test",
  now: new Date().toISOString()
});

const { httpServer } = createBackendServer();
await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));

const address = httpServer.address();
if (!address || typeof address === "string") {
  throw new Error("Unable to resolve socket test server address.");
}

const baseUrl = `http://127.0.0.1:${address.port}`;

function once(socket, eventName) {
  return new Promise((resolve) => {
    socket.once(eventName, resolve);
  });
}

const clientA = createClient(baseUrl, {
  transports: ["websocket"],
  forceNew: true
});
const clientB = createClient(baseUrl, {
  transports: ["websocket"],
  forceNew: true
});

try {
  await Promise.all([once(clientA, "connect"), once(clientB, "connect")]);

  const joinedA = once(clientA, "room:joined");
  clientA.emit("room:join", {
    docId: document.id,
    name: "张三"
  });
  const roomA = await joinedA;
  assert.equal(roomA.docId, document.id);
  assert.equal(roomA.users.length, 1);
  assert.equal(roomA.users[0].name, "张三");

  const presenceOnA = once(clientA, "presence:update");
  const joinedB = once(clientB, "room:joined");
  const systemOnAJoin = once(clientA, "system:new");
  clientB.emit("room:join", {
    docId: document.id,
    name: "张三"
  });

  const roomB = await joinedB;
  const updatedPresence = await presenceOnA;
  const joinSystem = await systemOnAJoin;

  assert.equal(roomB.users.length, 2);
  assert.equal(roomB.users[1].name, "张三#2");
  assert.equal(updatedPresence.length, 2);
  assert.equal(updatedPresence[0].color, updatedPresence[1].color);
  assert.equal(joinSystem.eventType, "user_joined");

  const chatOnA = once(clientA, "chat:new");
  clientB.emit("chat:send", {
    docId: document.id,
    name: "张三",
    message: "你好"
  });
  const chatMessage = await chatOnA;
  assert.equal(chatMessage.message, "你好");
  assert.equal(chatMessage.senderName, "张三#2");

  const savedBroadcast = once(clientA, "document:saved:broadcast");
  const savedSystem = once(clientA, "system:new");
  clientB.emit("document:saved", {
    docId: document.id,
    name: "张三#2",
    snapshotVersion: 3
  });
  const savedPayload = await savedBroadcast;
  const savedEvent = await savedSystem;
  assert.equal(savedPayload.snapshotVersion, 3);
  assert.equal(savedEvent.eventType, "document_saved");

  const presenceAfterLeave = once(clientA, "presence:update");
  const leaveSystem = once(clientA, "system:new");
  clientB.emit("room:leave", {
    docId: document.id,
    name: "张三"
  });
  const usersAfterLeave = await presenceAfterLeave;
  const leaveEvent = await leaveSystem;
  assert.equal(usersAfterLeave.length, 1);
  assert.equal(leaveEvent.eventType, "user_left");

  const reconnectClient = createClient(baseUrl, {
    transports: ["websocket"],
    forceNew: true
  });
  try {
    await once(reconnectClient, "connect");
    const rejoined = once(reconnectClient, "room:joined");
    const reconnectSystem = once(clientA, "system:new");
    reconnectClient.emit("client:reconnect-ready", {
      docId: document.id,
      name: "李四"
    });
    const reconnectRoom = await rejoined;
    const reconnectEvent = await reconnectSystem;
    assert.equal(reconnectRoom.docId, document.id);
    assert.equal(reconnectEvent.eventType, "reconnected");
  } finally {
    reconnectClient.disconnect();
  }

  const storedMessages = dataAccess.chat.getRecentMessages(document.id);
  assert.equal(storedMessages.length, 1);

  const storedEvents = dataAccess.systemEvents.getRecentSystemEvents(document.id, 10);
  assert.ok(storedEvents.some((event) => event.eventType === "document_saved"));
  assert.ok(storedEvents.some((event) => event.eventType === "user_joined"));
  assert.ok(storedEvents.some((event) => event.eventType === "user_left"));
  assert.ok(storedEvents.some((event) => event.eventType === "reconnected"));

  console.log("Task4 socket verification passed.");
} finally {
  clientA.disconnect();
  clientB.disconnect();
  await new Promise((resolve, reject) => {
    httpServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
  clearYjsRuntimeDocuments();
  closeDatabase();
  if (fs.existsSync(tempDbPath)) {
    fs.unlinkSync(tempDbPath);
  }
}
