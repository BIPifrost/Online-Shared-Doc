import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createDocument, getDocumentDetail } from "../api";
import { buildDocumentUrl, GUEST_NAME_STORAGE_KEY, getReadableErrorMessage, getPreferredGuestName, HOME_PAGE_TITLE, validateDocIdInput, validateGuestName } from "../features/auth-guest/home-flow";
const featureNotes = [
    {
        title: "匿名昵称进入",
        description: "不用注册登录，输入昵称后即可创建文档或凭文档编号加入。"
    },
    {
        title: "链接即入口",
        description: "文档页地址会携带昵称参数，方便课堂演示时直接分享。"
    },
    {
        title: "本地记忆昵称",
        description: "刷新首页后会恢复上一次使用的昵称，减少重复输入。"
    }
];
export function HomePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [guestName, setGuestName] = useState("");
    const [docIdInput, setDocIdInput] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    useEffect(() => {
        const storedName = typeof window === "undefined"
            ? ""
            : window.localStorage.getItem(GUEST_NAME_STORAGE_KEY);
        const preferredName = getPreferredGuestName({
            queryName: searchParams.get("name"),
            storedName
        });
        setGuestName(preferredName);
        if (typeof window !== "undefined" && preferredName) {
            window.localStorage.setItem(GUEST_NAME_STORAGE_KEY, preferredName);
        }
    }, [searchParams]);
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        const normalizedName = guestName.trim();
        if (normalizedName) {
            window.localStorage.setItem(GUEST_NAME_STORAGE_KEY, normalizedName);
            return;
        }
        window.localStorage.removeItem(GUEST_NAME_STORAGE_KEY);
    }, [guestName]);
    async function handleCreate() {
        try {
            const normalizedName = validateGuestName(guestName);
            setErrorMessage("");
            setIsCreating(true);
            const document = await createDocument(normalizedName);
            navigate(buildDocumentUrl(document.id, normalizedName));
        }
        catch (error) {
            setErrorMessage(getReadableErrorMessage(error, "创建文档失败，请稍后再试。"));
        }
        finally {
            setIsCreating(false);
        }
    }
    async function handleJoin() {
        try {
            const normalizedName = validateGuestName(guestName);
            const normalizedDocId = validateDocIdInput(docIdInput);
            setErrorMessage("");
            setIsJoining(true);
            await getDocumentDetail(normalizedDocId);
            navigate(buildDocumentUrl(normalizedDocId, normalizedName));
        }
        catch (error) {
            setErrorMessage(getReadableErrorMessage(error, "加入文档失败，请检查文档 ID。"));
        }
        finally {
            setIsJoining(false);
        }
    }
    return (_jsxs("main", { className: "home-shell", children: [_jsxs("section", { className: "home-hero", children: [_jsxs("div", { className: "home-hero__copy", children: [_jsx("span", { className: "home-kicker", children: "Anonymous Collaboration Entry" }), _jsx("h1", { children: HOME_PAGE_TITLE }), _jsx("p", { children: "\u8FD9\u662F\u591A\u4EBA\u5171\u4EAB\u6587\u6863\u5B9E\u9A8C\u7CFB\u7EDF\u7684\u7EDF\u4E00\u5165\u53E3\u9875\u3002\u8F93\u5165\u6635\u79F0\u540E\uFF0C\u4F60\u53EF\u4EE5\u521B\u5EFA\u65B0\u7684\u534F\u4F5C\u6587\u6863\uFF0C \u4E5F\u53EF\u4EE5\u51ED\u5DF2\u6709\u6587\u6863\u7F16\u53F7\u76F4\u63A5\u52A0\u5165\u540C\u4E00\u4EFD\u6587\u6863\u3002" })] }), _jsxs("div", { className: "home-hero__panel", children: [_jsxs("label", { className: "field", children: [_jsx("span", { className: "field__label", children: "\u4F60\u7684\u6635\u79F0" }), _jsx("input", { value: guestName, onChange: (event) => {
                                            setGuestName(event.target.value);
                                        }, placeholder: "\u4F8B\u5982\uFF1A\u5F20\u4E09" })] }), _jsx("div", { className: "action-row", children: _jsx("button", { type: "button", className: "primary-button", onClick: handleCreate, disabled: isCreating || isJoining, children: isCreating ? "正在创建..." : "创建文档" }) }), _jsx("div", { className: "divider", children: _jsx("span", { children: "\u6216\u4F7F\u7528\u6587\u6863\u7F16\u53F7\u52A0\u5165" }) }), _jsxs("label", { className: "field", children: [_jsx("span", { className: "field__label", children: "\u6587\u6863 ID" }), _jsx("input", { value: docIdInput, onChange: (event) => {
                                            setDocIdInput(event.target.value);
                                        }, placeholder: "\u8F93\u5165\u5DF2\u6709\u6587\u6863 ID" })] }), _jsx("div", { className: "action-row", children: _jsx("button", { type: "button", className: "secondary-button", onClick: handleJoin, disabled: isCreating || isJoining, children: isJoining ? "正在验证..." : "加入文档" }) }), errorMessage ? _jsx("p", { className: "error-banner", children: errorMessage }) : null] })] }), _jsxs("section", { className: "home-notes", children: [_jsxs("div", { className: "home-notes__header", children: [_jsx("span", { className: "home-kicker", children: "How It Works" }), _jsx("h2", { children: "\u9996\u9875\u8D1F\u8D23\u5B8C\u6210\u533F\u540D\u8FDB\u5165\u95ED\u73AF" })] }), _jsx("div", { className: "home-notes__grid", children: featureNotes.map((note) => (_jsxs("article", { className: "note-card", children: [_jsx("h3", { children: note.title }), _jsx("p", { children: note.description })] }, note.title))) })] })] }));
}
