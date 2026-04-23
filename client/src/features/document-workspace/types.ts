import type {
  ChatMessage,
  DocumentDetail,
  DocumentDiffResult,
  DocumentSnapshotDetail,
  DocumentSnapshotSummary,
  ExportFormat
} from "../../api";
import type { ConnectionStatus } from "../document-editor";

export type WorkspaceLoadState = "loading" | "ready" | "error";
export type WorkspaceSaveStatus = "saved" | "saving" | "unsaved";
export type WorkspaceAsyncState = "idle" | "loading" | "ready" | "error";

export type PresenceUser = {
  clientId: string;
  name: string;
  color: string;
  online: boolean;
  joinedAt: string;
};

export type WorkspaceSystemMessageTone =
  | "info"
  | "success"
  | "warning"
  | "error";

export type WorkspaceSystemMessage = {
  id: string;
  text: string;
  tone: WorkspaceSystemMessageTone;
  createdAt: string;
};

export type DocumentWorkspaceState = {
  docId: string;
  guestName: string;
  detail: DocumentDetail | null;
  editorContent: string;
  loadState: WorkspaceLoadState;
  loadError: string;
  connectionStatus: ConnectionStatus;
  isSynced: boolean;
  saveStatus: WorkspaceSaveStatus;
  presenceUsers: PresenceUser[];
  currentSocketId: string | null;
  snapshots: DocumentSnapshotSummary[];
  selectedSnapshotIds: number[];
  snapshotDetail: DocumentSnapshotDetail | null;
  snapshotDetailState: WorkspaceAsyncState;
  snapshotDetailError: string;
  diffResult: DocumentDiffResult | null;
  diffState: WorkspaceAsyncState;
  diffError: string;
  isExportPanelOpen: boolean;
  exportingFormat: ExportFormat | null;
  exportError: string;
  chatMessages: ChatMessage[];
  systemMessages: WorkspaceSystemMessage[];
  latestActivityLabel: string;
  onlineCount: number;
};
