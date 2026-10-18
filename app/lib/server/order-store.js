import "server-only";
import { get, list, put } from "@vercel/blob";
import { createOrderBlobStore } from "../order-blob";

export function orderStore() {
  return createOrderBlobStore({ get, list, put }, process.env.BLOB_READ_WRITE_TOKEN);
}
