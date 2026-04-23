import type { FormEvent } from "react";
import type { ChatMessage } from "../../api";
import { formatDateTime, getMessageToneLabel } from "./status";
import type { WorkspaceSystemMessage } from "./types";

type DocumentSidebarRightProps = {
  chatMessages: ChatMessage[];
  systemMessages: WorkspaceSystemMessage[];
  chatDraft: string;
  canSendChat: boolean;
  onChatDraftChange: (value: string) => void;
  onChatSend: () => void;
};

export function DocumentSidebarRight({
  chatMessages,
  systemMessages,
  chatDraft,
  canSendChat,
  onChatDraftChange,
  onChatSend
}: DocumentSidebarRightProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChatSend();
  }

  return (
    <aside className="workspace-sidebar workspace-sidebar--right">
      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="workspace-panel__eyebrow">Chat</p>
            <h2>Chat Panel</h2>
          </div>
          <span className="workspace-panel__meta">{chatMessages.length} items</span>
        </div>

        <div className="message-list">
          {chatMessages.length > 0 ? (
            chatMessages.map((message) => (
              <article key={message.id} className="message-card">
                <header>
                  <strong>{message.senderName}</strong>
                  <time dateTime={message.sentAt}>{formatDateTime(message.sentAt)}</time>
                </header>
                <p>{message.message}</p>
              </article>
            ))
          ) : (
            <div className="workspace-empty">
              <strong>Chat is ready</strong>
              <p>The first message sent here will appear to other collaborators in realtime.</p>
            </div>
          )}
        </div>

        <form className="chat-composer" onSubmit={handleSubmit}>
          <label className="chat-composer__label" htmlFor="workspace-chat-input">
            Chat message
          </label>
          <textarea
            id="workspace-chat-input"
            className="chat-composer__input"
            value={chatDraft}
            onChange={(event) => onChatDraftChange(event.target.value)}
            placeholder="Press Enter to send. Use Shift + Enter for a new line."
            rows={3}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onChatSend();
              }
            }}
          />
          <div className="chat-composer__footer">
            <span>Only the latest 50 chat messages are kept in the panel.</span>
            <button
              type="submit"
              className="toolbar-button toolbar-button--primary"
              disabled={!canSendChat}
            >
              Send
            </button>
          </div>
        </form>
      </section>

      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="workspace-panel__eyebrow">System</p>
            <h2>System Messages</h2>
          </div>
          <span className="workspace-panel__meta">{systemMessages.length} items</span>
        </div>

        <div className="system-message-list">
          {systemMessages.length > 0 ? (
            systemMessages.map((message) => (
              <article
                key={message.id}
                className={`system-message system-message--${message.tone}`}
              >
                <header>
                  <strong>{getMessageToneLabel(message.tone)}</strong>
                  <time dateTime={message.createdAt}>
                    {formatDateTime(message.createdAt)}
                  </time>
                </header>
                <p>{message.text}</p>
              </article>
            ))
          ) : (
            <div className="workspace-empty">
              <strong>System area is ready</strong>
              <p>Connection, save, and reconnect notices will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}
