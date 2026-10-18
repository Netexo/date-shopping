import { clearSession } from "../../../lib/server/auth";
import { checkOrigin, errorResponse, json } from "../../../lib/server/http";

export async function POST(request) {
  try { checkOrigin(request); await clearSession(request); return json({ ok: true }); }
  catch (error) { return errorResponse(error); }
}
