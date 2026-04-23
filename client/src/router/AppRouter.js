import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from "react-router-dom";
import { DocumentEntryPage } from "../pages/DocumentEntryPage";
import { HomePage } from "../pages/HomePage";
export function AppRouter() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/doc/:docId", element: _jsx(DocumentEntryPage, {}) })] }));
}
