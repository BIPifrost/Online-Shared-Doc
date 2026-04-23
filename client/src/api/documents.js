import { getReadableErrorMessage, validateDocIdInput, validateGuestName } from "../features/auth-guest/home-flow";
async function readJson(response) {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
        throw new Error("接口返回了非 JSON 内容，请确认前端已正确连接到服务端。");
    }
    const payload = (await response.json());
    if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "请求失败，请稍后再试。");
    }
    return payload.data;
}
export async function createDocument(name) {
    const guestName = validateGuestName(name);
    try {
        const response = await fetch("/api/documents", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: guestName
            })
        });
        return await readJson(response);
    }
    catch (error) {
        throw new Error(getReadableErrorMessage(error, "创建文档失败，请稍后再试。"));
    }
}
export async function getDocumentDetail(docId) {
    const normalizedDocId = validateDocIdInput(docId);
    try {
        const response = await fetch(`/api/documents/${encodeURIComponent(normalizedDocId)}`);
        return await readJson(response);
    }
    catch (error) {
        if (error instanceof Error && error.message === "Document not found.") {
            throw new Error("文档不存在，请检查文档 ID。");
        }
        throw new Error(getReadableErrorMessage(error, "读取文档失败，请检查文档 ID。"));
    }
}
