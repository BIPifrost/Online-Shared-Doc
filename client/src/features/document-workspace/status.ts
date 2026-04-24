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
      return { label: "已连接", tone: "success" as const };
    case "disconnected":
      return { label: "已断开", tone: "error" as const };
    default:
      return { label: "连接中", tone: "warning" as const };
  }
}

export function getSaveStatusMeta(status: WorkspaceSaveStatus) {
  switch (status) {
    case "saving":
      return { label: "保存中", tone: "warning" as const };
    case "unsaved":
      return { label: "未保存", tone: "info" as const };
    default:
      return { label: "已保存", tone: "success" as const };
  }
}

export function getEditorActivityLabel(input: {
  loadState: WorkspaceLoadState;
  connectionStatus: ConnectionStatus;
  saveStatus: WorkspaceSaveStatus;
  isSynced: boolean;
}) {
  if (input.loadState === "loading") {
    return "正在加载工作区并准备协作环境。";
  }

  if (input.loadState === "error") {
    return "文档加载失败。";
  }

  if (input.connectionStatus === "disconnected") {
    return "连接已断开，正在自动重连。";
  }

  if (input.connectionStatus === "connecting") {
    return "正在连接到协作服务。";
  }

  if (input.saveStatus === "saving") {
    return "正在保存当前文档状态。";
  }

  if (input.saveStatus === "unsaved") {
    return "存在更改但尚未创建新的快照。";
  }

  if (!input.isSynced) {
    return "已连接，等待最新的 Yjs 状态同步完成。";
  }

  return "工作区已就绪，可以进行编辑、历史查看和导出操作。";
}

export function getMessageToneLabel(tone: WorkspaceSystemMessageTone) {
  switch (tone) {
    case "error":
      return "错误";
    case "warning":
      return "警告";
    case "success":
      return "成功";
    default:
      return "系统";
  }
}
