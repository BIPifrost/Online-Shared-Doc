import { Link, useParams, useSearchParams } from "react-router-dom";
import { CollaborativeEditor } from "../features/document-editor";
import { DocumentHistoryPanel } from "../features/document-history";
import { DocumentSidebarLeft } from "../features/document-workspace/DocumentSidebarLeft";
import { DocumentSidebarRight } from "../features/document-workspace/DocumentSidebarRight";
import { MarkdownPreview } from "../features/document-workspace/MarkdownPreview";
import { DocumentToolbar } from "../features/document-workspace/DocumentToolbar";
import { formatDateTime } from "../features/document-workspace/status";
import { useDocumentWorkspace } from "../features/document-workspace/useDocumentWorkspace";
import { ExportPanel } from "../features/export-panel";

const FALLBACK_EDITOR_COLOR = "#0ea5e9";

export function DocumentEntryPage() {
  const { docId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const workspace = useDocumentWorkspace(docId, searchParams.get("name"));

  const currentUser =
    workspace.presenceUsers.find((user) =>
      workspace.currentSocketId
        ? user.clientId === workspace.currentSocketId
        : user.name === workspace.guestName
    ) ?? workspace.presenceUsers[0];

  const editorUserColor = currentUser?.color ?? FALLBACK_EDITOR_COLOR;
  const toolbarTitle =
    workspace.detail?.title ??
    (workspace.loadState === "loading"
      ? "Loading document..."
      : "Document Workspace");

  function handleHistoryClick() {
    document
      .getElementById("document-history-panel")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="workspace-shell">
      <DocumentToolbar
        title={toolbarTitle}
        docId={workspace.docId}
        loadState={workspace.loadState}
        connectionStatus={workspace.connectionStatus}
        saveStatus={workspace.saveStatus}
        onlineCount={workspace.onlineCount}
        latestUpdatedAt={
          workspace.detail?.latestUpdatedAt
            ? formatDateTime(workspace.detail.latestUpdatedAt)
            : "Waiting for sync"
        }
        isExportPanelOpen={workspace.isExportPanelOpen}
        onSave={workspace.handleSave}
        onExportClick={workspace.handleExportClick}
        onHistoryClick={handleHistoryClick}
      />

      <section className="workspace-layout">
        <DocumentSidebarLeft
          guestName={workspace.guestName}
          currentSocketId={workspace.currentSocketId}
          users={workspace.presenceUsers}
          snapshots={workspace.snapshots}
          selectedSnapshotIds={workspace.selectedSnapshotIds}
          onSnapshotToggle={workspace.handleSnapshotToggle}
        />

        <section className="workspace-main">
          <div className="workspace-main__split">
            <div className="workspace-panel workspace-panel--editor">
              <div className="workspace-panel__header workspace-panel__header--main">
                <div>
                  <p className="workspace-panel__eyebrow">Editor</p>
                  <h2>Markdown Input</h2>
                </div>
                <div className="workspace-main__meta">
                  <span>Current user: {workspace.guestName}</span>
                  <span>Status: {workspace.latestActivityLabel}</span>
                </div>
              </div>

              {workspace.loadState === "loading" ? (
                <div className="workspace-feedback">
                  <strong>Loading</strong>
                  <p>Fetching document data and starting the collaborative editor.</p>
                </div>
              ) : null}

              {workspace.loadState === "error" ? (
                <div className="workspace-feedback workspace-feedback--error">
                  <strong>Load failed</strong>
                  <p>{workspace.loadError}</p>
                  <Link className="primary-link" to="/">
                    Back to Home
                  </Link>
                </div>
              ) : null}

              {workspace.detail && workspace.loadState === "ready" ? (
                <>
                  <div className="editor-status-banner">
                    <span className="editor-status-banner__title">Editor State</span>
                    <span>{workspace.latestActivityLabel}</span>
                  </div>

                  <CollaborativeEditor
                    className="workspace-editor"
                    docId={workspace.docId}
                    userName={workspace.guestName}
                    userColor={editorUserColor}
                    onConnectionStatusChange={workspace.handleEditorConnectionChange}
                    onSyncStateChange={workspace.handleEditorSyncChange}
                    onContentChange={workspace.handleEditorContentChange}
                  />
                </>
              ) : null}
            </div>

            <section className="workspace-panel workspace-panel--preview workspace-panel--preview-main">
              <div className="workspace-panel__header">
                <div>
                  <p className="workspace-panel__eyebrow">Preview</p>
                  <h2>Markdown Preview</h2>
                </div>
              </div>
              <MarkdownPreview content={workspace.editorContent} />
            </section>
          </div>

          <ExportPanel
            isOpen={workspace.isExportPanelOpen}
            exportingFormat={workspace.exportingFormat}
            exportError={workspace.exportError}
            onExport={workspace.handleExportDownload}
          />

          <DocumentHistoryPanel
            snapshots={workspace.snapshots}
            selectedSnapshotIds={workspace.selectedSnapshotIds}
            snapshotDetail={workspace.snapshotDetail}
            snapshotDetailState={workspace.snapshotDetailState}
            snapshotDetailError={workspace.snapshotDetailError}
            diffResult={workspace.diffResult}
            diffState={workspace.diffState}
            diffError={workspace.diffError}
            onClearSelection={workspace.handleClearSnapshotSelection}
          />
        </section>

        <DocumentSidebarRight
          chatMessages={workspace.chatMessages}
          chatDraft={workspace.chatDraft}
          canSendChat={workspace.canSendChat}
          onChatDraftChange={workspace.handleChatDraftChange}
          onChatSend={workspace.handleChatSend}
          systemMessages={workspace.systemMessages}
        />
      </section>
    </main>
  );
}
