import { describe, expect, it, vi } from "vitest";
import { EventRouter, matchesRoutingKey } from "./event-router";

describe("matchesRoutingKey", () => {
  it.each([
    ["user.u1.*", "user.u1.chat_message", true],
    ["user.u1.*", "user.u2.chat_message", false],
    ["user.*.*", "user.u1.chat_message", true],
    ["user.*.*", "user.u1", false],
    ["ticket.t1.*", "ticket.t1.status.extra", false],
    ["test.#", "test", true],
    ["test.#", "test.ping", true],
    ["test.#", "test.ticket.created", true],
    ["#", "anything.at.all", true],
    ["a.#.z", "a.z", true],
    ["a.#.z", "a.b.c.z", true],
    ["a.#.z", "a.b.c", false],
    ["exact.key", "exact.key", true],
    ["exact.key", "exact.keys", false],
  ])("%s vs %s → %s", (pattern, key, expected) => {
    expect(matchesRoutingKey(pattern, key)).toBe(expected);
  });
});

describe("EventRouter", () => {
  it("delivers only to listeners with a matching pattern", () => {
    const router = new EventRouter();
    const agent = vi.fn();
    const customer = vi.fn();
    router.subscribe(["user.u1.*"], agent);
    router.subscribe(["ticket.t1.*"], customer);

    router.dispatch("ticket.t1.chat_message", { hi: 1 });

    expect(customer).toHaveBeenCalledWith("ticket.t1.chat_message", { hi: 1 });
    expect(agent).not.toHaveBeenCalled();
  });

  it("delivers once to a listener even when several of its patterns match", () => {
    const router = new EventRouter();
    const listener = vi.fn();
    router.subscribe(["user.u1.*", "user.*.*"], listener);

    router.dispatch("user.u1.ticket_created", {});

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stops delivering after unsubscribe", () => {
    const router = new EventRouter();
    const listener = vi.fn();
    const unsubscribe = router.subscribe(["user.u1.*"], listener);

    unsubscribe();
    router.dispatch("user.u1.chat_message", {});

    expect(listener).not.toHaveBeenCalled();
    expect(router.size).toBe(0);
  });

  it("keeps delivering to other listeners when one throws", () => {
    const router = new EventRouter();
    const healthy = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    router.subscribe(["user.u1.*"], () => {
      throw new Error("stream closed");
    });
    router.subscribe(["user.u1.*"], healthy);

    router.dispatch("user.u1.chat_message", {});

    expect(healthy).toHaveBeenCalledTimes(1);
  });
});
