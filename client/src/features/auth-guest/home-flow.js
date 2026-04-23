export const HOME_PAGE_TITLE = "在线共享文档协作平台";
export const GUEST_NAME_STORAGE_KEY = "online-shared-doc.guest-name";
function normalizeValue(value) {
    return value?.trim() ?? "";
}
export function getPreferredGuestName(input) {
    return normalizeValue(input.queryName) || normalizeValue(input.storedName);
}
export function validateGuestName(name) {
    const normalizedName = normalizeValue(name);
    if (!normalizedName) {
        throw new Error("昵称不能为空。");
    }
    return normalizedName;
}
export function validateDocIdInput(docId) {
    const normalizedDocId = normalizeValue(docId);
    if (!normalizedDocId) {
        throw new Error("文档 ID 不能为空。");
    }
    return normalizedDocId;
}
export function buildDocumentUrl(docId, guestName) {
    const normalizedDocId = validateDocIdInput(docId);
    const normalizedGuestName = validateGuestName(guestName);
    return `/doc/${encodeURIComponent(normalizedDocId)}?name=${encodeURIComponent(normalizedGuestName)}`;
}
export function getReadableErrorMessage(error, fallback = "操作失败，请稍后再试。") {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }
    return fallback;
}
