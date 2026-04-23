import type { ConnectionStatus } from "../document-editor";
import { getConnectionStatusMeta, getSaveStatusMeta } from "./status";
import type {
  WorkspaceLoadState,
  WorkspaceSaveStatus
} from "./types";

type DocumentToolbarProps = {
  title: string;
  docId: string;
  loadState: WorkspaceLoadState;
  connectionStatus: ConnectionStatus;
  saveStatus: WorkspaceSaveStatus;
  onlineCount: number;
  latestUpdatedAt: string;
  isExportPanelOpen: boolean;
  onSave: () => void;
  onExportClick: () => void;
  onHistoryClick: () => void;
};

export function DocumentToolbar({
  title,
  docId,
  loadState,
  connectionStatus,
  saveStatus,
  onlineCount,
  latestUpdatedAt,
  isExportPanelOpen,
  onSave,
  onExportClick,
  onHistoryClick
}: DocumentToolbarProps) {
  const connectionMeta = getConnectionStatusMeta(connectionStatus);
  const saveMeta = getSaveStatusMeta(saveStatus);
  const disabled = loadState !== "ready";

  return (
    <header className="workspace-toolbar">
      <div className="workspace-toolbar__identity">
        <div>
          <p className="workspace-toolbar__eyebrow">Document Workspace</p>
          <h1>{title}</h1>
        </div>
        <p className="workspace-toolbar__doc-meta">Doc ID: {docId}</p>
      </div>

      <div className="workspace-toolbar__status-row">
        <span
          className={`status-pill status-pill--${connectionMeta.tone}`}
          aria-label={`Connection status: ${connectionMeta.label}`}
        >
          Connection · {connectionMeta.label}
        </span>
        <span
          className={`status-pill status-pill--${saveMeta.tone}`}
          aria-label={`Save status: ${saveMeta.label}`}
        >
          Save · {saveMeta.label}
        </span>
        <span className="status-pill status-pill--neutral">
          Online · {onlineCount}
        </span>
        <span className="status-pill status-pill--neutral">
          Updated · {latestUpdatedAt}
        </span>
      </div>

      <div className="workspace-toolbar__actions">
        <button
          type="button"
          className="toolbar-button toolbar-button--primary"
          onClick={onSave}
          disabled={disabled || saveStatus === "saving"}
        >
          {saveStatus === "saving" ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          className={`toolbar-button${isExportPanelOpen ? " toolbar-button--active" : ""}`}
          onClick={onExportClick}
          disabled={disabled}
        >
          {isExportPanelOpen ? "Hide Export" : "Export"}
        </button>
        <button
          type="button"
          className="toolbar-button"
          onClick={onHistoryClick}
          disabled={disabled}
        >
          History
        </button>
      </div>
    </header>
  );
}
