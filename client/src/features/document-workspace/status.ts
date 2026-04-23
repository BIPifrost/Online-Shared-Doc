import type { ConnectionStatus } from "../document-editor";
import type {
  WorkspaceLoadState,
  WorkspaceSaveStatus,
  WorkspaceSystemMessageTone
} from "./types";

export function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function getConnectionStatusMeta(status: ConnectionStatus) {
  switch (status) {
    case "connected":
      return { label: "Connected", tone: "success" as const };
    case "disconnected":
      return { label: "Disconnected", tone: "error" as const };
    default:
      return { label: "Connecting", tone: "warning" as const };
  }
}

export function getSaveStatusMeta(status: WorkspaceSaveStatus) {
  switch (status) {
    case "saving":
      return { label: "Saving", tone: "warning" as const };
    case "unsaved":
      return { label: "Unsaved", tone: "info" as const };
    default:
      return { label: "Saved", tone: "success" as const };
  }
}

export function getEditorActivityLabel(input: {
  loadState: WorkspaceLoadState;
  connectionStatus: ConnectionStatus;
  saveStatus: WorkspaceSaveStatus;
  isSynced: boolean;
}) {
  if (input.loadState === "loading") {
    return "Loading the workspace and preparing collaboration.";
  }

  if (input.loadState === "error") {
    return "The document could not be loaded.";
  }

  if (input.connectionStatus === "disconnected") {
    return "Connection lost. Automatic reconnect is in progress.";
  }

  if (input.connectionStatus === "connecting") {
    return "Connecting to collaboration services.";
  }

  if (input.saveStatus === "saving") {
    return "Saving the current document state.";
  }

  if (input.saveStatus === "unsaved") {
    return "Changes are present but no new snapshot has been created yet.";
  }

  if (!input.isSynced) {
    return "Connected. Waiting for the latest Yjs state to finish syncing.";
  }

  return "Workspace is ready for editing, history review, and export.";
}

export function getMessageToneLabel(tone: WorkspaceSystemMessageTone) {
  switch (tone) {
    case "error":
      return "Error";
    case "warning":
      return "Warning";
    case "success":
      return "Success";
    default:
      return "System";
  }
}
