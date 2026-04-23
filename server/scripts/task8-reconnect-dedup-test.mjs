import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { io as createClient } from "socket.io-client";
import { initializeDatabase, closeDatabase } from "../dist/db/index.js";
import { createBackendServer } from "../dist/app/createBackendServer.js";
import { clearYjsRuntimeDocuments } from "../dist/modules/yjs/runtime.js";
import { getDataAccess } from "../dist/services/data-access.js";

const tempDbPath = path.resolve("data/task8-reconnect-test.db");
process.env.APP_DB_PATH = tempDbPath;
process.env.NODE_ENV = "test";

if (fs.existsSync(tempDbPath)) {
  fs.unlinkSync(tempDbPath);
}

initializeDatabase();
clearYjsRuntimeDocuments();

const dataAccess = getDataAccess();
const document = dataAccess.documents.createDocument({
  createdByName: "task8-test",
  now: new Date().toISOString()
});

const { httpServer } = createBackendServer();
await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));

const address = httpServer.address();
if (!address || typeof address === "string") {
  throw new Error("Unable to resolve task8 socket test server address.");
}

const baseUrl = `http://127.0.0.1:${address.port}`;

function once(socket, eventName) {
  return new Promise((resolve) => {
    socket.once(eventName, resolve);
  });
}

const client = createClient(baseUrl, {
  transports: ["websocket"],
  forceNew: true
});

try {
  await once(client, "connect");

  const reconnectedRoom = once(client, "room:joined");
  client.emit("client:reconnect-ready", {
    docId: document.id,
    name: "Alice"
  });
  const firstJoin = await reconnectedRoom;
  assert.equal(firstJoin.users.length, 1);
  assert.equal(firstJoin.users[0].name, "Alice");

  const duplicateJoin = once(client, "room:joined");
  client.emit("room:join", {
    docId: document.id,
    name: "Alice"
  });
  const secondJoin = await duplicateJoin;

  assert.equal(secondJoin.users.length, 1);
  assert.equal(secondJoin.users[0].name, "Alice");

  const storedEvents = dataAccess.systemEvents.getRecentSystemEvents(document.id, 10);
  assert.equal(storedEvents.filter((event) => event.eventType === "reconnected").length, 1);
  assert.equal(storedEvents.filter((event) => event.eventType === "user_joined").length, 0);

  console.log("Task8 reconnect dedup verification passed.");
} finally {
  client.disconnect();
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
