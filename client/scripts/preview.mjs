import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { stat, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const indexPath = path.join(distDir, "index.html");
const port = 5173;

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"]
]);

function getMimeType(filePath) {
  return mimeTypes.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream";
}

function resolveDistPath(urlPath) {
  const normalized = urlPath === "/" ? "/index.html" : urlPath;
  const resolved = path.normalize(path.join(distDir, normalized));

  if (!resolved.startsWith(distDir)) {
    return null;
  }

  return resolved;
}

if (!existsSync(indexPath)) {
  console.error("Missing client/dist/index.html. Run the client build first.");
  process.exit(1);
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const filePath = resolveDistPath(requestUrl.pathname);

  if (!filePath) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }

  try {
    const fileStat = await stat(filePath);

    if (fileStat.isFile()) {
      response.writeHead(200, { "Content-Type": getMimeType(filePath) });
      createReadStream(filePath).pipe(response);
      return;
    }
  } catch {
    // Fall through to SPA fallback.
  }

  const indexHtml = await readFile(indexPath);
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(indexHtml);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Preview server listening at http://127.0.0.1:${port}`);
});
