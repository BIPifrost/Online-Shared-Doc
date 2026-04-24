import { useState, type FormEvent } from "react";
import type { ExportFormat } from "../../api";

type ExportPanelProps = {
  isOpen: boolean;
  exportingFormat: ExportFormat | null;
  exportError: string;
  currentTitle: string;
  onExport: (format: ExportFormat, exportFileName?: string) => void;
};

const EXPORT_OPTIONS: Array<{
  format: ExportFormat;
  title: string;
  description: string;
}> = [
  {
    format: "markdown",
    title: "导出 Markdown",
    description: "下载最新的 Markdown 源代码为 .md 文件。"
  },
  {
    format: "html",
    title: "导出 HTML",
    description: "将最新内容渲染为基本 HTML 文档。"
  },
  {
    format: "txt",
    title: "导出 TXT",
    description: "下载最新内容为纯文本。"
  }
];

export function ExportPanel({
  isOpen,
  exportingFormat,
  exportError,
  currentTitle,
  onExport
}: ExportPanelProps) {
  const [exportFileName, setExportFileName] = useState(currentTitle);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(format: ExportFormat, event?: FormEvent) {
    event?.preventDefault();
    onExport(format, exportFileName.trim() || undefined);
  }

  return (
    <section
      className="workspace-panel workspace-panel--export"
      id="document-export-panel"
    >
      <div className="workspace-panel__header">
        <div>
          <p className="workspace-panel__eyebrow">导出</p>
          <h2>导出面板</h2>
        </div>
        <span className="workspace-panel__meta">3 种格式</span>
      </div>

      <label className="field">
        <span className="field__label">导出文件名（可选）</span>
        <input
          value={exportFileName}
          onChange={(event) => setExportFileName(event.target.value)}
          placeholder="留空则使用文档标题"
        />
      </label>

      <div className="export-option-list">
        {EXPORT_OPTIONS.map((option) => {
          const isExporting = exportingFormat === option.format;

          return (
            <article key={option.format} className="export-option-card">
              <div className="export-option-card__copy">
                <strong>{option.title}</strong>
                <p>{option.description}</p>
              </div>
              <button
                type="button"
                className="toolbar-button toolbar-button--primary"
                disabled={Boolean(exportingFormat)}
                onClick={(event) => handleSubmit(option.format, event)}
              >
                {isExporting ? "导出中..." : "开始导出"}
              </button>
            </article>
          );
        })}
      </div>

      {exportError ? (
        <div className="workspace-feedback workspace-feedback--error">
          <strong>导出失败</strong>
          <p>{exportError}</p>
        </div>
      ) : null}
    </section>
  );
}
