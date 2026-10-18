import "server-only";
import { BackendError } from "../backend-error";

export const privateHeaders = { "Cache-Control": "no-store, private", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };
export function json(data, status = 200) { return Response.json(data, { status, headers: privateHeaders }); }

export function checkOrigin(request) {
  const origin = request.headers.get("origin");
  // Next.js may use its bind address (0.0.0.0) in request.url. The Host header
  // identifies the actual LAN address or hostname used by the browser.
  const host = request.headers.get("host") || new URL(request.url).host;
  let allowed = false;
  try {
    const source = new URL(origin);
    allowed = ["http:", "https:"].includes(source.protocol) && source.origin === origin
      && source.host.toLowerCase() === host.toLowerCase();
  } catch { /* Missing or malformed origins are rejected. */ }
  if (!allowed || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new BackendError("Diese Anfrage ist nicht erlaubt.", 403);
  }
}

export async function readJson(request, maximum = 16384) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new BackendError("JSON-Daten erwartet.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new BackendError("Die Anfrage ist leer.", 400);
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximum) { await reader.cancel(); throw new BackendError("Die Anfrage ist zu groß.", 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new BackendError("Ungültige JSON-Daten.", 400); }
}

export function errorResponse(error) {
  return json({ error: error instanceof BackendError ? error.message : "Die Anfrage konnte nicht verarbeitet werden. Bitte versuche es erneut." }, error instanceof BackendError ? error.status : 503);
}
