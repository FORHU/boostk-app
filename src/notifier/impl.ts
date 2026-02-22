import type { Notifier } from "./core";
import { InMemoryNotifier } from "./memory";

let notifier: Notifier | null = null;

export function getNotifier() {
  if (!notifier) {
    notifier = new InMemoryNotifier();
  }

  return notifier;
}
