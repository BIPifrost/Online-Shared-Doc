import type { ExportFormat } from "../../types/domain.js";
import { HttpError } from "../../services/http-errors.js";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+?)`/g, "<code>$1</code>");
}

function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inCodeBlock = false;
  let inUnorderedList = false;
  let inOrderedList = false;

  const closeLists = () => {
    if (inUnorderedList) {
      html.push("</ul>");
      inUnorderedList = false;
    }

    if (inOrderedList) {
      html.push("</ol>");
      inOrderedList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      closeLists();

      if (!inCodeBlock) {
        html.push("<pre><code>");
        inCodeBlock = true;
      } else {
        html.push("</code></pre>");
        inCodeBlock = false;
      }
      continue;
    }

    if (inCodeBlock) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (!trimmed) {
      closeLists();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeLists();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      closeLists();
      html.push(`<blockquote>${inlineMarkdown(quoteMatch[1])}</blockquote>`);
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      if (!inUnorderedList) {
        closeLists();
        html.push("<ul>");
        inUnorderedList = true;
      }
      html.push(`<li>${inlineMarkdown(unorderedMatch[1])}</li>`);
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (!inOrderedList) {
        closeLists();
        html.push("<ol>");
        inOrderedList = true;
      }
      html.push(`<li>${inlineMarkdown(orderedMatch[1])}</li>`);
      continue;
    }

    closeLists();
    html.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }

  closeLists();

  if (inCodeBlock) {
    html.push("</code></pre>");
  }

  return html.join("\n");
}

export function buildExportDocument(
  format: ExportFormat,
  title: string,
  markdown: string
) {
  if (format === "markdown") {
    return {
      contentType: "text/markdown; charset=utf-8",
      extension: "md",
      content: markdown
    };
  }

  if (format === "txt") {
    return {
      contentType: "text/plain; charset=utf-8",
      extension: "txt",
      content: markdown
    };
  }

  if (format === "html") {
    const rendered = markdownToHtml(markdown);

    return {
      contentType: "text/html; charset=utf-8",
      extension: "html",
      content: `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    ${rendered}
  </body>
</html>`
    };
  }

  throw new HttpError(500, "Unsupported export format.");
}
