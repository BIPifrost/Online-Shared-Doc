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
            <p className="workspace-panel__eyebrow">Collaborators</p>
            <h2>Online Users</h2>
          </div>
          <span className="workspace-panel__meta">{users.length} users</span>
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
                    <span>{current ? "Current user" : "Remote collaborator"}</span>
                  </div>
                  <span className="presence-card__state">
                    {user.online ? "online" : "offline"}
                  </span>
                </article>
              );
            })
          ) : (
            <div className="workspace-empty">
              <strong>Collaborator list is ready</strong>
              <p>This area shows active users and their editor colors.</p>
            </div>
          )}
        </div>
      </section>

      <section className="workspace-panel" id="document-history-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="workspace-panel__eyebrow">History</p>
            <h2>Snapshots</h2>
          </div>
          <span className="workspace-panel__meta">{snapshots.length} items</span>
        </div>

        <div className="workspace-selection-hint">
          Select 1 snapshot to view details, or 2 snapshots to compare differences.
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
                    <span>{selected ? "selected" : "click to select"}</span>
                  </div>
                  <span>Saved by: {snapshot.savedByName}</span>
                  <time dateTime={snapshot.savedAt}>
                    {formatDateTime(snapshot.savedAt)}
                  </time>
                </button>
              );
            })
          ) : (
            <div className="workspace-empty">
              <strong>No manual snapshots yet</strong>
              <p>Snapshots are created only when the Save button is pressed.</p>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}
