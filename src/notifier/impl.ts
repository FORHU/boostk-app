import type { Notifier } from "./core";
import { InMemoryNotifier } from "./memory";

const globalForNotifier = globalThis as unknown as {
  __notifier: Notifier | undefined;
};

export function getNotifier() {
  if (typeof window !== "undefined") {
    throw new Error("getNotifier() can only be called on the server.");
  }

  if (!globalForNotifier.__notifier) {
    globalForNotifier.__notifier = new InMemoryNotifier();
  }

  return globalForNotifier.__notifier;
}
