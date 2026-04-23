import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState, startTransition } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { yCollab } from "y-codemirror.next";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import "./collaborative-editor.css";
function createColorLight(color) {
    return `${color}33`;
}
function buildWebsocketServerUrl(websocketPath) {
    if (websocketPath.startsWith("ws://") || websocketPath.startsWith("wss://")) {
        return websocketPath.replace(/\/$/, "");
    }
    const resolved = new URL(websocketPath, window.location.origin);
    resolved.protocol = resolved.protocol === "https:" ? "wss:" : "ws:";
    return resolved.toString().replace(/\/$/, "");
}
export function CollaborativeEditor({ docId, userName, userColor, className, websocketPath = "/yjs" }) {
    const editorHostRef = useRef(null);
    const [connectionStatus, setConnectionStatus] = useState("connecting");
    const [isSynced, setIsSynced] = useState(false);
    useEffect(() => {
        const hostElement = editorHostRef.current;
        if (!hostElement) {
            return;
        }
        hostElement.replaceChildren();
        const ydoc = new Y.Doc();
        const provider = new WebsocketProvider(buildWebsocketServerUrl(websocketPath), docId, ydoc);
        const ytext = ydoc.getText("content");
        const undoManager = new Y.UndoManager(ytext);
        provider.awareness.setLocalStateField("user", {
            name: userName,
            color: userColor,
            colorLight: createColorLight(userColor)
        });
        const state = EditorState.create({
            doc: ytext.toString(),
            extensions: [
                basicSetup,
                EditorView.lineWrapping,
                yCollab(ytext, provider.awareness, {
                    undoManager
                })
            ]
        });
        const view = new EditorView({
            state,
            parent: hostElement
        });
        const handleStatus = (event) => {
            startTransition(() => {
                setConnectionStatus(event.status);
            });
        };
        const handleSync = (synced) => {
            startTransition(() => {
                setIsSynced(synced);
            });
        };
        provider.on("status", handleStatus);
        provider.on("sync", handleSync);
        return () => {
            provider.off("status", handleStatus);
            provider.off("sync", handleSync);
            provider.destroy();
            undoManager.destroy();
            view.destroy();
            ydoc.destroy();
        };
    }, [docId, userColor, userName, websocketPath]);
    return (_jsxs("section", { className: `collaborative-editor ${className ?? ""}`.trim(), children: [_jsxs("header", { className: "collaborative-editor__status", children: [_jsxs("span", { className: "collaborative-editor__badge", children: ["Socket: ", connectionStatus] }), _jsxs("span", { className: "collaborative-editor__badge", children: ["Yjs: ", isSynced ? "synced" : "syncing"] })] }), _jsx("div", { className: "collaborative-editor__surface", ref: editorHostRef })] }));
}
