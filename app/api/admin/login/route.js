import { BackendError } from "../../../lib/backend-error";
import { passwordMatches } from "../../../lib/admin-session";
import { checkOrigin, errorResponse, json, readJson } from "../../../lib/server/http";
import { adminPassword, saveSession } from "../../../lib/server/auth";

const attemptsKey = Symbol.for("date-shopping.admin-login-attempts");
const attempts = globalThis[attemptsKey] ||= { failures: 0, resetAt: 0 };

export async function POST(request) {
  try {
    checkOrigin(request);
    const password = adminPassword();
    const input = await readJson(request, 4096);
    if (Date.now() >= attempts.resetAt) { attempts.failures = 0; attempts.resetAt = Date.now() + 5 * 60 * 1000; }
    if (attempts.failures >= 10) throw new BackendError("Zu viele Anmeldeversuche. Bitte warte fünf Minuten.", 429);
    if (!passwordMatches(input?.password, password)) {
      attempts.failures++;
      throw new BackendError("Das Passwort ist nicht korrekt.", 401);
    }
    await saveSession(request);
    attempts.failures = 0;
    return json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
