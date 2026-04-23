import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import WebSocket from "ws";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { initializeDatabase, closeDatabase } from "../dist/db/index.js";
import { createBackendServer } from "../dist/app/createBackendServer.js";
import { clearYjsRuntimeDocuments } from "../dist/modules/yjs/runtime.js";
import { getDataAccess } from "../dist/services/data-access.js";

const tempDbPath = path.resolve("data/task5-test.db");
process.env.APP_DB_PATH = tempDbPath;
process.env.NODE_ENV = "test";

if (fs.existsSync(tempDbPath)) {
  fs.unlinkSync(tempDbPath);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(check, timeoutMs, message) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await check();
    if (result) {
      return result;
    }

    await delay(50);
  }

  throw new Error(message);
}

function createProvider(baseUrl, docId, name, color) {
  const doc = new Y.Doc();
  const provider = new WebsocketProvider(`${baseUrl}/yjs`, docId, doc, {
    WebSocketPolyfill: WebSocket
  });

  provider.awareness.setLocalStateField("user", {
    name,
    color
  });

  return {
    doc,
    provider,
    text: doc.getText("content")
  };
}

async function startServer() {
  initializeDatabase();

  const { httpServer, io, yjs } = createBackendServer();
  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));

  const address = httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to resolve Task5 test server address.");
  }

  return {
    httpServer,
    io,
    yjs,
    baseHttpUrl: `http://127.0.0.1:${address.port}`,
    baseWsUrl: `ws://127.0.0.1:${address.port}`
  };
}

function stopServer(server) {
  server.io.close();
  server.yjs.close();

  if (server.httpServer.listening) {
    server.httpServer.close();
  }
}

let firstServer = null;
let secondServer = null;
let providerA = null;
let providerB = null;
let providerC = null;
let verificationPassed = false;

try {
  firstServer = await startServer();

  const createResponse = await fetch(`${firstServer.baseHttpUrl}/api/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "task5-tester"
    })
  });
  assert.equal(createResponse.status, 201);

  const createPayload = await createResponse.json();
  assert.equal(createPayload.success, true);
  const docId = createPayload.data.id;

  providerA = createProvider(firstServer.baseWsUrl, docId, "张三", "#0ea5e9");
  providerB = createProvider(firstServer.baseWsUrl, docId, "李四", "#14b8a6");

  await waitFor(
    () => providerA.provider.wsconnected && providerB.provider.wsconnected,
    5000,
    "Yjs providers did not connect."
  );

  providerA.text.insert(0, "# Hello");

  await waitFor(
    () => providerB.text.toString() === "# Hello",
    5000,
    "Second Yjs client did not receive the text update."
  );

  await waitFor(
    () => providerA.provider.awareness.getStates().size >= 2,
    5000,
    "Awareness states did not synchronize."
  );

  await delay(2400);

  const firstPersistedState = getDataAccess().yjs.getDocumentState(docId);
  assert.ok(firstPersistedState);
  assert.equal(firstPersistedState.plainText, "# Hello");
  assert.equal(firstPersistedState.markdownText, "# Hello");
  assert.ok(firstPersistedState.yjsState.length > 0);
  assert.equal(firstPersistedState.stateRevision, 1);

  providerA.text.insert(providerA.text.length, "\nWorld");
  providerA.text.insert(providerA.text.length, "\nAgain");

  await waitFor(
    () => providerB.text.toString() === "# Hello\nWorld\nAgain",
    5000,
    "Batched Yjs text update did not reach the second client."
  );

  await delay(2400);

  const secondPersistedState = getDataAccess().yjs.getDocumentState(docId);
  assert.ok(secondPersistedState);
  assert.equal(secondPersistedState.plainText, "# Hello\nWorld\nAgain");
  assert.equal(secondPersistedState.markdownText, "# Hello\nWorld\nAgain");
  assert.equal(secondPersistedState.stateRevision, 2);

  await delay(2400);
  const stablePersistedState = getDataAccess().yjs.getDocumentState(docId);
  assert.equal(stablePersistedState?.stateRevision, 2);

  const saveResponse = await fetch(
    `${firstServer.baseHttpUrl}/api/documents/${docId}/save`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "张三",
        title: "Task5 协同文档"
      })
    }
  );
  assert.equal(saveResponse.status, 200);

  const savePayload = await saveResponse.json();
  assert.equal(savePayload.success, true);
  assert.equal(savePayload.data.snapshotVersion, 1);
  assert.equal(savePayload.data.stateRevision, 3);

  const snapshot = getDataAccess().history.getSnapshotById(docId, savePayload.data.snapshotId);
  assert.equal(snapshot?.content, "# Hello\nWorld\nAgain");

  providerA.provider.destroy();
  providerB.provider.destroy();
  providerA = null;
  providerB = null;

  stopServer(firstServer);
  closeDatabase();
  clearYjsRuntimeDocuments();
  firstServer = null;

  secondServer = await startServer();
  providerC = createProvider(secondServer.baseWsUrl, docId, "王五", "#f97316");

  await waitFor(
    () => providerC.text.toString() === "# Hello\nWorld\nAgain",
    5000,
    "Persisted Yjs content was not restored after restart."
  );

  console.log("Task5 Yjs verification passed.");
  verificationPassed = true;
} finally {
  providerA?.provider.destroy();
  providerB?.provider.destroy();
  providerC?.provider.destroy();

  if (firstServer) {
    stopServer(firstServer);
  }

  if (secondServer) {
    stopServer(secondServer);
  }

  clearYjsRuntimeDocuments();
  closeDatabase();

  if (fs.existsSync(tempDbPath)) {
    fs.unlinkSync(tempDbPath);
  }

  if (verificationPassed) {
    process.exit(0);
  }
}
