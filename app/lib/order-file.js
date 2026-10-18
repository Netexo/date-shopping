import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { validateOrder } from "./order-validation.js";
import { readAppointment } from "../shop/lib/appointment.js";
import { BackendError } from "./backend-error.js";

// Shared across route bundles and development reloads in this one Node.js process.
const queueKey = Symbol.for("date-shopping.order-file-queues");
const queues = globalThis[queueKey] ||= new Map();

function serialize(file, operation) {
  const next = (queues.get(file) || Promise.resolve()).then(operation);
  const tail = next.catch(() => {});
  queues.set(file, tail);
  tail.then(() => { if (queues.get(file) === tail) queues.delete(file); });
  return next;
}

function validSnapshot(order) {
  if (!order || typeof order.id !== "string" || typeof order.idempotencyKey !== "string"
    || typeof order.requestHash !== "string" || order.status !== "completed"
    || !readAppointment(order.date, order.time) || !Number.isFinite(Date.parse(order.created_at))
    || !Number.isInteger(order.spent) || order.spent < 1 || order.spent > 100 || order.remaining !== 100 - order.spent
    || !Array.isArray(order.items) || !order.items.length) return false;
  const ids = new Set();
  return order.items.every((item) => {
    if (!item || typeof item.id !== "string" || ids.has(item.id) || typeof item.name !== "string"
      || !Number.isInteger(item.credits) || item.credits < 1) return false;
    ids.add(item.id);
    return true;
  }) && order.items.reduce((total, item) => total + item.credits, 0) === order.spent;
}

function publicOrder({ id, date, time, items, spent, remaining, created_at, status }) {
  return { id, date, time, items, spent, remaining, created_at, status };
}
function receipt(order) {
  const { id, date, time, spent, remaining, created_at, status } = order;
  return { id, date, time, spent, remaining, created_at, status };
}

export function createOrderFileStore(filename) {
  const file = resolve(filename);

  async function load() {
    let text;
    try { text = await readFile(file, "utf8"); }
    catch (error) {
      if (error.code !== "ENOENT") throw new BackendError("Die Bestellungen konnten nicht gelesen werden. Bitte prüfe die Dateirechte auf dem Server.");
      try {
        await mkdir(dirname(file), { recursive: true, mode: 0o700 });
        const handle = await open(file, "wx", 0o600);
        try { await handle.writeFile("[]\n"); await handle.sync(); } finally { await handle.close(); }
        return [];
      } catch (creationError) {
        if (creationError.code === "EEXIST") return load();
        throw new BackendError("Die Bestelldatei konnte nicht angelegt werden. Bitte prüfe die Schreibrechte auf dem Server.");
      }
    }
    try {
      const orders = JSON.parse(text);
      if (!Array.isArray(orders) || !orders.every(validSnapshot)) throw new Error("Invalid file");
      return orders;
    } catch {
      // Never replace an unreadable file with an empty array and lose existing orders.
      throw new BackendError("Die Bestelldatei ist beschädigt. Bitte prüfe data/orders.json oder stelle eine Sicherung wieder her.");
    }
  }

  async function write(orders) {
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      const handle = await open(temporary, "wx", 0o600);
      try { await handle.writeFile(`${JSON.stringify(orders, null, 2)}\n`); await handle.sync(); }
      finally { await handle.close(); }
      // Same-directory rename replaces the entire file atomically.
      await rename(temporary, file);
    } catch {
      await unlink(temporary).catch(() => {});
      throw new BackendError("Deine Bestellung konnte nicht gespeichert werden. Bitte versuche es erneut oder prüfe die Schreibrechte auf dem Server.");
    }
  }

  return {
    async create(input) {
      const validated = validateOrder(input);
      const canonical = { date: validated.date, time: validated.time,
        entries: validated.items.map(({ id, variantId }) => variantId ? { id, variantId } : { id }).sort((a, b) => a.id.localeCompare(b.id)) };
      const requestHash = createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
      return serialize(file, async () => {
        const orders = await load();
        const existing = orders.find((order) => order.idempotencyKey === validated.idempotencyKey);
        if (existing) {
          if (existing.requestHash !== requestHash) throw new BackendError("Diese Bestellkennung gehört zu einer anderen Auswahl. Bitte prüfe deine Bestellung.", 409);
          return receipt(existing);
        }
        const order = { ...validated, id: randomUUID(), requestHash, created_at: new Date().toISOString(), status: "completed" };
        await write([...orders, order]);
        return receipt(order);
      });
    },
    async list(page = 0) {
      return serialize(file, async () => {
        const orders = await load();
        orders.sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
        return { orders: orders.slice(page * 25, page * 25 + 25).map(publicOrder), page, hasMore: orders.length > page * 25 + 25 };
      });
    },
  };
}
