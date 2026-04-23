const DEV_BACKEND_PORT = "3001";

export function getRealtimeServerHttpOrigin() {
  if (typeof window === "undefined") {
    return `http://127.0.0.1:${DEV_BACKEND_PORT}`;
  }

  if (!import.meta.env.DEV || window.location.port === DEV_BACKEND_PORT) {
    return window.location.origin;
  }

  return `${window.location.protocol}//${window.location.hostname}:${DEV_BACKEND_PORT}`;
}

export function getRealtimeServerWebSocketOrigin() {
  const httpOrigin = getRealtimeServerHttpOrigin();
  const url = new URL(httpOrigin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString().replace(/\/$/, "");
}
