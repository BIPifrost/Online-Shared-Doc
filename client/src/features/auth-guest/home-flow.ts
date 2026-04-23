export const HOME_PAGE_TITLE = "Online Shared Document Workspace";
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
    throw new Error("Guest name cannot be empty.");
  }

  return normalizedName;
}

export function validateDocIdInput(docId: string) {
  const normalizedDocId = normalizeValue(docId);

  if (!normalizedDocId) {
    throw new Error("Document ID cannot be empty.");
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
  fallback = "The operation failed. Please try again."
) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
