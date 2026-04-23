import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getDocumentDetail } from "../api/documents";
import { GUEST_NAME_STORAGE_KEY, getPreferredGuestName } from "../features/auth-guest/home-flow";
export function DocumentEntryPage() {
    const { docId = "" } = useParams();
    const [searchParams] = useSearchParams();
    const [detail, setDetail] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const guestName = getPreferredGuestName({
        queryName: searchParams.get("name"),
        storedName: typeof window === "undefined"
            ? ""
            : window.localStorage.getItem(GUEST_NAME_STORAGE_KEY)
    });
    useEffect(() => {
        if (typeof window !== "undefined" && guestName) {
            window.localStorage.setItem(GUEST_NAME_STORAGE_KEY, guestName);
        }
    }, [guestName]);
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setErrorMessage("");
        getDocumentDetail(docId)
            .then((payload) => {
            if (cancelled) {
                return;
            }
            setDetail(payload);
        })
            .catch((error) => {
            if (cancelled) {
                return;
            }
            setErrorMessage(error instanceof Error ? error.message : "文档加载失败，请稍后再试。");
        })
            .finally(() => {
            if (cancelled) {
                return;
            }
            setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [docId]);
    return (_jsx("main", { className: "entry-shell", children: _jsxs("section", { className: "entry-card", children: [_jsxs("div", { className: "entry-card__eyebrow", children: [_jsx("span", { children: "\u5DF2\u8FDB\u5165\u76EE\u6807\u6587\u6863\u5730\u5740" }), _jsx("span", { children: "Task6 Handoff" })] }), _jsxs("div", { className: "entry-card__header", children: [_jsxs("div", { children: [_jsx("p", { className: "entry-card__label", children: "\u5F53\u524D\u6587\u6863" }), _jsx("h1", { children: detail?.title ?? "正在读取文档信息" })] }), _jsxs("div", { className: "entry-card__pill-group", children: [_jsxs("span", { className: "entry-card__pill", children: ["Doc ID: ", docId] }), _jsxs("span", { className: "entry-card__pill", children: ["\u6635\u79F0: ", guestName || "未提供昵称"] })] })] }), isLoading ? (_jsx("div", { className: "entry-card__feedback", children: "\u6B63\u5728\u9A8C\u8BC1\u6587\u6863\u662F\u5426\u53EF\u7528..." })) : null, errorMessage ? (_jsx("div", { className: "entry-card__feedback entry-card__feedback--error", children: errorMessage })) : null, detail ? (_jsxs("div", { className: "entry-metadata", children: [_jsxs("article", { children: [_jsx("span", { children: "\u521B\u5EFA\u8005" }), _jsx("strong", { children: detail.createdByName })] }), _jsxs("article", { children: [_jsx("span", { children: "\u5F53\u524D\u4FEE\u8BA2" }), _jsx("strong", { children: detail.stateRevision })] }), _jsxs("article", { children: [_jsx("span", { children: "\u6700\u65B0\u5FEB\u7167" }), _jsx("strong", { children: detail.latestSnapshotVersion })] })] })) : null, _jsxs("div", { className: "entry-card__footer", children: [_jsx("p", { children: "\u521B\u5EFA\u4E0E\u52A0\u5165\u6D41\u7A0B\u5DF2\u7ECF\u63A5\u901A\uFF0C\u540E\u7EED Task7 \u4F1A\u628A\u8FD9\u91CC\u6269\u5C55\u6210\u5B8C\u6574\u7684\u6587\u6863\u534F\u4F5C\u9875\u6846\u67B6\u3002" }), _jsx(Link, { className: "primary-link", to: "/", children: "\u8FD4\u56DE\u9996\u9875" })] })] }) }));
}
