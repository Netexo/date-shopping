import "server-only";
import { join, resolve, sep } from "node:path";
import { createOrderFileStore } from "../order-file";
import { BackendError } from "../backend-error";

export function orderStore() {
  const file = resolve(process.env.ORDERS_FILE || join(process.cwd(), "data", "orders.json"));
  const publicDirectory = resolve(process.cwd(), "public");
  if (file === publicDirectory || file.startsWith(publicDirectory + sep)) throw new BackendError("Die Bestelldatei muss außerhalb des öffentlichen public-Ordners liegen.");
  return createOrderFileStore(file);
}
