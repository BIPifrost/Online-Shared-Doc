export const HOME_PAGE_TITLE = "在线共享文档工作区";
export const GUEST_NAME_STORAGE_KEY = "online-shared-doc.guest-name";

function normalizeValue(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function getPreferredGuestName(input: {
  queryName?: string | null;
  storedName?: string | null;
}) {
  return normalizeValue(input.queryName) || normalizeValue(input.storedName);
}

export function validateGuestName(name: string) {
  const normalizedName = normalizeValue(name);

  if (!normalizedName) {
    throw new Error("昵称不能为空。");
  }

  return normalizedName;
}

export function validateDocIdInput(docId: string) {
  const normalizedDocId = normalizeValue(docId);

  if (!normalizedDocId) {
    throw new Error("文档 ID 不能为空。");
  }

  return normalizedDocId;
}

export function buildDocumentUrl(docId: string, guestName: string) {
  const normalizedDocId = validateDocIdInput(docId);
  const normalizedGuestName = validateGuestName(guestName);

  return `/doc/${encodeURIComponent(normalizedDocId)}?name=${encodeURIComponent(
    normalizedGuestName
  )}`;
}

export function getReadableErrorMessage(
  error: unknown,
  fallback = "操作失败，请重试。"
) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
