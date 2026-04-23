import type { DocumentSnapshot } from "../../types/domain.js";

type DiffPart = {
  kind: "added" | "removed" | "unchanged";
  value: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function buildLcsMatrix(left: string[], right: string[]) {
  const matrix = Array.from({ length: left.length + 1 }, () =>
    Array.from<number>({ length: right.length + 1 }).fill(0)
  );

  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      if (left[i] === right[j]) {
        matrix[i][j] = matrix[i + 1][j + 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i + 1][j], matrix[i][j + 1]);
      }
    }
  }

  return matrix;
}

function diffLines(leftText: string, rightText: string) {
  const left = leftText.split("\n");
  const right = rightText.split("\n");
  const matrix = buildLcsMatrix(left, right);
  const result: DiffPart[] = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      result.push({ kind: "unchanged", value: left[i] });
      i += 1;
      j += 1;
      continue;
    }

    if (matrix[i + 1][j] >= matrix[i][j + 1]) {
      result.push({ kind: "removed", value: left[i] });
      i += 1;
      continue;
    }

    result.push({ kind: "added", value: right[j] });
    j += 1;
  }

  while (i < left.length) {
    result.push({ kind: "removed", value: left[i] });
    i += 1;
  }

  while (j < right.length) {
    result.push({ kind: "added", value: right[j] });
    j += 1;
  }

  return result;
}

export function buildSnapshotDiff(
  fromSnapshot: DocumentSnapshot,
  toSnapshot: DocumentSnapshot
) {
  const changes = diffLines(fromSnapshot.content, toSnapshot.content);

  const diffHtml = changes
    .map((change) => {
      const escaped = escapeHtml(change.value);
      const className =
        change.kind === "added"
          ? "diff-added"
          : change.kind === "removed"
            ? "diff-removed"
            : "diff-unchanged";

      return `<div class="${className}"><pre>${escaped}</pre></div>`;
    })
    .join("");

  const addedCount = changes.filter((change) => change.kind === "added").length;
  const removedCount = changes.filter((change) => change.kind === "removed").length;

  return {
    fromSnapshot,
    toSnapshot,
    diffHtml: `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: "Segoe UI", sans-serif; margin: 0; padding: 16px; background: #f8fafc; color: #0f172a; }
      .meta { margin-bottom: 16px; padding: 12px 16px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; }
      .diff-added { background: rgba(34, 197, 94, 0.14); border-left: 4px solid #22c55e; margin-bottom: 8px; }
      .diff-removed { background: rgba(239, 68, 68, 0.14); border-left: 4px solid #ef4444; margin-bottom: 8px; text-decoration: line-through; }
      .diff-unchanged { background: white; border-left: 4px solid #cbd5e1; margin-bottom: 8px; }
      pre { margin: 0; padding: 12px 16px; white-space: pre-wrap; word-break: break-word; }
    </style>
  </head>
  <body>
    <div class="meta">
      <div>From: v${fromSnapshot.snapshotVersion} @ ${fromSnapshot.savedAt}</div>
      <div>To: v${toSnapshot.snapshotVersion} @ ${toSnapshot.savedAt}</div>
    </div>
    ${diffHtml}
  </body>
</html>`,
    diffTextSummary: `Compared snapshot v${fromSnapshot.snapshotVersion} to v${toSnapshot.snapshotVersion}. Added lines: ${addedCount}. Removed lines: ${removedCount}.`
  };
}
