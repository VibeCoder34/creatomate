import { randomUUID } from "crypto";

type Entry = { buffer: Buffer; expires: number };

const store = new Map<string, Entry>();
const TTL_MS = 15 * 60 * 1000;

function purgeExpired() {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expires <= now) store.delete(id);
  }
}

export function putEphemeralAudio(buffer: Buffer): string {
  purgeExpired();
  const id = randomUUID();
  store.set(id, { buffer, expires: Date.now() + TTL_MS });
  return id;
}

export function getEphemeralAudio(id: string): Buffer | null {
  const entry = store.get(id);
  if (!entry) return null;
  if (entry.expires <= Date.now()) {
    store.delete(id);
    return null;
  }
  return entry.buffer;
}
