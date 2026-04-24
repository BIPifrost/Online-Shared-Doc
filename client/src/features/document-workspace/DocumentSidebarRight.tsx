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
            <p className="workspace-panel__eyebrow">聊天</p>
            <h2>聊天面板</h2>
          </div>
          <span className="workspace-panel__meta">{chatMessages.length} 条</span>
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
              <strong>聊天已就绪</strong>
              <p>在此发送的第一条消息将实时显示给其他协作者。</p>
            </div>
          )}
        </div>

        <form className="chat-composer" onSubmit={handleSubmit}>
          <label className="chat-composer__label" htmlFor="workspace-chat-input">
            聊天消息
          </label>
          <textarea
            id="workspace-chat-input"
            className="chat-composer__input"
            value={chatDraft}
            onChange={(event) => onChatDraftChange(event.target.value)}
            placeholder="按 Enter 发送，Shift + Enter 换行。"
            rows={3}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onChatSend();
              }
            }}
          />
          <div className="chat-composer__footer">
            <span>仅保留最近 50 条聊天消息。</span>
            <button
              type="submit"
              className="toolbar-button toolbar-button--primary"
              disabled={!canSendChat}
            >
              发送
            </button>
          </div>
        </form>
      </section>

      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <p className="workspace-panel__eyebrow">系统</p>
            <h2>系统消息</h2>
          </div>
          <span className="workspace-panel__meta">{systemMessages.length} 条</span>
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
              <strong>系统区域已就绪</strong>
              <p>连接、保存和重连通知将显示在此处。</p>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}
