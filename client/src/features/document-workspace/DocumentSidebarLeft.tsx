import type { DocumentSnapshotSummary } from "../../api";
import { formatDateTime } from "./status";
import type { PresenceUser } from "./types";

type DocumentSidebarLeftProps = {
  guestName: string;
  currentSocketId: string | null;
  users: PresenceUser[];
  snapshots: DocumentSnapshotSummary[];
  selectedSnapshotIds: number[];
  onSnapshotToggle: (snapshotId: number) => void;
};

function isCurrentUser(
  user: PresenceUser,
  guestName: string,
  currentSocketId: string | null
) {
  if (currentSocketId) {
    return user.clientId === currentSocketId;
  }

  return user.name === guestName;
}

export function DocumentSidebarLeft({
  guestName,
  currentSocketId,
  users,
  snapshots,
  selectedSnapshotIds,
  onSnapshotToggle
}: DocumentSidebarLeftProps) {
  return (
    <aside className="workspace-sidebar workspace-sidebar--left">
      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="workspace-panel__eyebrow">协作者</p>
            <h2>在线用户</h2>
          </div>
          <span className="workspace-panel__meta">{users.length} 人</span>
        </div>

        <div className="presence-list">
          {users.length > 0 ? (
            users.map((user) => {
              const current = isCurrentUser(user, guestName, currentSocketId);

              return (
                <article
                  key={user.clientId}
                  className={`presence-card${current ? " presence-card--current" : ""}`}
                >
                  <span
                    className="presence-card__swatch"
                    style={{ backgroundColor: user.color }}
                    aria-hidden="true"
                  />
                  <div className="presence-card__body">
                    <strong>{user.name}</strong>
                    <span>{current ? "当前用户" : "远程协作者"}</span>
                  </div>
                  <span className="presence-card__state">
                    {user.online ? "在线" : "离线"}
                  </span>
                </article>
              );
            })
          ) : (
            <div className="workspace-empty">
              <strong>协作者列表已就绪</strong>
              <p>此区域显示活跃用户及其编辑器颜色。</p>
            </div>
          )}
        </div>
      </section>

      <section className="workspace-panel" id="document-history-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="workspace-panel__eyebrow">历史</p>
            <h2>快照</h2>
          </div>
          <span className="workspace-panel__meta">{snapshots.length} 项</span>
        </div>

        <div className="workspace-selection-hint">
          选择 1 个快照查看详情，或选择 2 个快照比较差异。
        </div>

        <div className="snapshot-list">
          {snapshots.length > 0 ? (
            snapshots.map((snapshot) => {
              const selected = selectedSnapshotIds.includes(snapshot.id);

              return (
                <button
                  key={snapshot.id}
                  type="button"
                  className={`snapshot-card snapshot-card--button${
                    selected ? " snapshot-card--selected" : ""
                  }`}
                  onClick={() => onSnapshotToggle(snapshot.id)}
                >
                  <div className="snapshot-card__header">
                    <strong>v{snapshot.snapshotVersion}</strong>
                    <span>{selected ? "已选中" : "点击选择"}</span>
                  </div>
                  <span>保存者: {snapshot.savedByName}</span>
                  <time dateTime={snapshot.savedAt}>
                    {formatDateTime(snapshot.savedAt)}
                  </time>
                </button>
              );
            })
          ) : (
            <div className="workspace-empty">
              <strong>暂无手动快照</strong>
              <p>只有点击保存按钮时才会创建快照。</p>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}
