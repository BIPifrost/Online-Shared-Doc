import type { ExportFormat } from "../../api";

type ExportPanelProps = {
  isOpen: boolean;
  exportingFormat: ExportFormat | null;
  exportError: string;
  onExport: (format: ExportFormat) => void;
};

const EXPORT_OPTIONS: Array<{
  format: ExportFormat;
  title: string;
  description: string;
}> = [
  {
    format: "markdown",
    title: "Export Markdown",
    description: "Download the latest Markdown source as an .md file."
  },
  {
    format: "html",
    title: "Export HTML",
    description: "Render the latest content into a basic HTML document."
  },
  {
    format: "txt",
    title: "Export TXT",
    description: "Download the latest content as plain text."
  }
];

export function ExportPanel({
  isOpen,
  exportingFormat,
  exportError,
  onExport
}: ExportPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <section
      className="workspace-panel workspace-panel--export"
      id="document-export-panel"
    >
      <div className="workspace-panel__header">
        <div>
          <p className="workspace-panel__eyebrow">Export</p>
          <h2>Export Panel</h2>
        </div>
        <span className="workspace-panel__meta">3 formats</span>
      </div>

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
                onClick={() => onExport(option.format)}
              >
                {isExporting ? "Exporting..." : "Start Export"}
              </button>
            </article>
          );
        })}
      </div>

      {exportError ? (
        <div className="workspace-feedback workspace-feedback--error">
          <strong>Export failed</strong>
          <p>{exportError}</p>
        </div>
      ) : null}
    </section>
  );
}
