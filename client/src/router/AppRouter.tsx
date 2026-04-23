import { Routes, Route } from "react-router-dom";
import { DocumentEntryPage } from "../pages/DocumentEntryPage";
import { HomePage } from "../pages/HomePage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/doc/:docId" element={<DocumentEntryPage />} />
    </Routes>
  );
}
