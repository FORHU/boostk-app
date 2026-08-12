import { queryOptions } from "@tanstack/react-query";
import {
  getIntakeMessagesFn,
  getIntakeSessionFn,
  getIsPlatformStaffFn,
  getTriageQueueFn,
  getTriageTargetsFn,
  getTriageThreadFn,
} from "./intake.functions";
import type { TriageFilter } from "./intake.schema";

export const intakeQueries = {
  all: ["intake"] as const,

  /**
   * The BOOSTK-wide conversation list, per outcome. `filter` is part of the key so the
   * three tabs cache independently instead of clobbering each other on every switch.
   */
  queue: (search?: string, filter: TriageFilter = "waiting") =>
    queryOptions({
      queryKey: [...intakeQueries.all, "queue", filter, search ?? ""] as const,
      queryFn: () => getTriageQueueFn({ data: { search, filter, take: 25 } }),
    }),

  /** Full transcript of one intake conversation, for the triage detail panel. */
  thread: (intakeTicketId: string) =>
    queryOptions({
      queryKey: [...intakeQueries.all, "thread", intakeTicketId] as const,
      queryFn: () => getTriageThreadFn({ data: { intakeTicketId } }),
    }),

  /** Organizations + their projects, for the routing picker. */
  targets: () =>
    queryOptions({
      queryKey: [...intakeQueries.all, "targets"] as const,
      queryFn: () => getTriageTargetsFn(),
      // The org/project list barely moves compared to the queue beside it.
      staleTime: 5 * 60 * 1000,
    }),

  /** The visitor's own conversation on the public /chat route. */
  session: () =>
    queryOptions({
      queryKey: [...intakeQueries.all, "session"] as const,
      queryFn: () => getIntakeSessionFn(),
    }),

  /**
   * Messages in the visitor's own conversation. Takes no ticket id — the server resolves
   * it from the intake cookie, so a visitor cannot ask for someone else's thread.
   */
  messages: () =>
    queryOptions({
      queryKey: [...intakeQueries.all, "messages"] as const,
      queryFn: () => getIntakeMessagesFn(),
    }),

  /** Drives the staff-only triage link in the topbar. A UI affordance, not a guard. */
  isPlatformStaff: () =>
    queryOptions({
      queryKey: [...intakeQueries.all, "is-platform-staff"] as const,
      queryFn: () => getIsPlatformStaffFn(),
      staleTime: 5 * 60 * 1000,
    }),
};
