import { OrderValidationError } from "../../lib/order-validation";
import { requireAdmin } from "../../lib/server/auth";
import { orderStore } from "../../lib/server/order-store";
import { checkOrigin, errorResponse, json, readJson } from "../../lib/server/http";


export async function POST(request) {
  try {
    checkOrigin(request);
    const receipt = await orderStore().create(await readJson(request));
    return json({ receipt });
  } catch (error) {
    if (error instanceof OrderValidationError) return json({ error: error.message }, 400);
    return errorResponse(error);
  }
}

export async function GET(request) {
  try {
    await requireAdmin();
    const requested = Number(new URL(request.url).searchParams.get("page") || 0);
    const page = Number.isSafeInteger(requested) && requested >= 0 && requested <= 10000 ? requested : 0;
    return json(await orderStore().list(page));
  } catch (error) { return errorResponse(error); }
}
