import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const helperModulePath = pathToFileURL(
  path.resolve(".task6-test-build/features/auth-guest/home-flow.js")
).href;

const {
  HOME_PAGE_TITLE,
  GUEST_NAME_STORAGE_KEY,
  buildDocumentUrl,
  getPreferredGuestName,
  validateDocIdInput,
  validateGuestName
} = await import(helperModulePath);

assert.equal(HOME_PAGE_TITLE, "在线共享文档协作平台");
assert.equal(GUEST_NAME_STORAGE_KEY, "online-shared-doc.guest-name");

assert.equal(
  getPreferredGuestName({
    queryName: " 张三 ",
    storedName: "李四"
  }),
  "张三"
);
assert.equal(
  getPreferredGuestName({
    queryName: "",
    storedName: " 李四 "
  }),
  "李四"
);
assert.equal(
  getPreferredGuestName({
    queryName: " ",
    storedName: ""
  }),
  ""
);

assert.equal(validateGuestName(" 张三 "), "张三");
assert.throws(
  () => validateGuestName("  "),
  /昵称不能为空/
);

assert.equal(validateDocIdInput(" doc_123 "), "doc_123");
assert.throws(
  () => validateDocIdInput(" "),
  /文档 ID 不能为空/
);

assert.equal(
  buildDocumentUrl("doc_123", "张 三"),
  "/doc/doc_123?name=%E5%BC%A0%20%E4%B8%89"
);

console.log("Task6 home flow verification passed.");
