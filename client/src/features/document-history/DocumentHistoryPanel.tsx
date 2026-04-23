import type {
  DocumentDiffResult,
  DocumentSnapshotDetail,
  DocumentSnapshotSummary
} from "../../api";
import { formatDateTime } from "../document-workspace/status";
import type { WorkspaceAsyncState } from "../document-workspace/types";

type DocumentHistoryPanelProps = {
  snapshots: DocumentSnapshotSummary[];
  selectedSnapshotIds: number[];
  snapshotDetail: DocumentSnapshotDetail | null;
  snapshotDetailState: WorkspaceAsyncState;
  snapshotDetailError: string;
  diffResult: DocumentDiffResult | null;
  diffState: WorkspaceAsyncState;
  diffError: string;
  onClearSelection: () => void;
};

function getSnapshotLabel(
  snapshots: DocumentSnapshotSummary[],
  snapshotId: number
) {
  const snapshot = snapshots.find((item) => item.id === snapshotId);
  return snapshot ? `v${snapshot.snapshotVersion}` : `#${snapshotId}`;
}

export function DocumentHistoryPanel({
  snapshots,
  selectedSnapshotIds,
  snapshotDetail,
  snapshotDetailState,
  snapshotDetailError,
  diffResult,
  diffState,
  diffError,
  onClearSelection
}: DocumentHistoryPanelProps) {
  const selectedLabels = selectedSnapshotIds.map((snapshotId) =>
    getSnapshotLabel(snapshots, snapshotId)
  );

  return (
    <section className="workspace-panel workspace-panel--history-detail">
      <div className="workspace-panel__header">
        <div>
          <p className="workspace-panel__eyebrow">Version Compare</p>
          <h2>Snapshot Detail and Diff</h2>
        </div>
        <span className="workspace-panel__meta">
          Selected {selectedSnapshotIds.length} / 2
        </span>
      </div>

      <div className="history-selection-bar">
        <div className="history-selection-bar__chips">
          {selectedLabels.length > 0 ? (
            selectedLabels.map((label) => (
              <span key={label} className="history-chip">
                {label}
              </span>
            ))
          ) : (
            <span className="history-selection-bar__hint">
              Pick one snapshot for detail view or two snapshots for highlighted diff output.
            </span>
          )}
        </div>
        {selectedSnapshotIds.length > 0 ? (
          <button
            type="button"
            className="toolbar-button"
            onClick={onClearSelection}
          >
            Clear Selection
          </button>
        ) : null}
      </div>

      {selectedSnapshotIds.length === 0 ? (
        <div className="workspace-empty">
          <strong>History panel is ready</strong>
          <p>Save the document to create snapshots, then inspect one or compare two.</p>
        </div>
      ) : null}

      {selectedSnapshotIds.length === 1 ? (
        <>
          {snapshotDetailState === "loading" ? (
            <div className="workspace-feedback">
              <strong>Loading snapshot detail</strong>
              <p>The selected snapshot content is being fetched.</p>
            </div>
          ) : null}

          {snapshotDetailState === "error" ? (
            <div className="workspace-feedback workspace-feedback--error">
              <strong>Snapshot detail failed to load</strong>
              <p>{snapshotDetailError}</p>
            </div>
          ) : null}

          {snapshotDetailState === "ready" && snapshotDetail ? (
            <div className="history-detail-card">
              <header className="history-detail-card__header">
                <div>
                  <strong>v{snapshotDetail.snapshotVersion}</strong>
                  <span>{snapshotDetail.title}</span>
                </div>
                <div className="history-detail-card__meta">
                  <span>Saved by: {snapshotDetail.savedByName}</span>
                  <time dateTime={snapshotDetail.savedAt}>
                    {formatDateTime(snapshotDetail.savedAt)}
                  </time>
                </div>
              </header>
              <pre className="history-detail-card__content">
                {snapshotDetail.content}
              </pre>
            </div>
          ) : null}
        </>
      ) : null}

      {selectedSnapshotIds.length === 2 ? (
        <>
          {diffState === "loading" ? (
            <div className="workspace-feedback">
              <strong>Loading version diff</strong>
              <p>The two selected snapshots are being compared.</p>
            </div>
          ) : null}

          {diffState === "error" ? (
            <div className="workspace-feedback workspace-feedback--error">
              <strong>Version diff failed to load</strong>
              <p>{diffError}</p>
            </div>
          ) : null}

          {diffState === "ready" && diffResult ? (
            <div className="diff-viewer">
              <div className="diff-viewer__summary">
                <strong>
                  v{diffResult.fromSnapshot.snapshotVersion} compared with v
                  {diffResult.toSnapshot.snapshotVersion}
                </strong>
                <p>{diffResult.diffTextSummary}</p>
              </div>
              <iframe
                title="Snapshot diff preview"
                className="diff-viewer__frame"
                sandbox=""
                srcDoc={diffResult.diffHtml}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
