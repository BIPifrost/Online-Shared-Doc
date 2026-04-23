const DEFAULT_PORT = 3001;

export function getPort() {
  const rawPort = process.env.PORT;
  const parsed = Number(rawPort);

  if (!rawPort || Number.isNaN(parsed)) {
    return DEFAULT_PORT;
  }

  return parsed;
}
