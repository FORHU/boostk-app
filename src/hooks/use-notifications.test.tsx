// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventType } from "@/lib/notifier/core";
import { getUnreadTicketSummaries } from "@/modules/notification/notification.functions";
import { HEARTBEAT_TIMEOUT_MS, useNotifications } from "./use-notifications";

vi.mock("@/modules/notification/notification.functions", () => ({
  getUnreadTicketSummaries: vi.fn().mockResolvedValue([]),
  markTicketReadFn: vi.fn(),
  markIntakeTicketReadFn: vi.fn(),
}));

type MockListener = (e: { type: string; data: string }) => void;

class MockEventSource {
  static instances: MockEventSource[] = [];
  static listeners = new Map<string, MockListener[]>();

  url: string;
  closed = false;
  onmessage: ((e: { type: string; data: string }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, fn: MockListener) {
    const list = MockEventSource.listeners.get(type) ?? [];
    list.push(fn);
    MockEventSource.listeners.set(type, list);
  }

  close() {
    this.closed = true;
  }

  static reset() {
    MockEventSource.instances = [];
    MockEventSource.listeners = new Map();
  }

  static dispatch(type: string, data?: unknown) {
    const e = {
      type,
      data: typeof data === "string" ? data : JSON.stringify(data ?? {}),
    };
    const list = MockEventSource.listeners.get(type) ?? [];
    for (const fn of list) fn(e);
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
  MockEventSource.reset();
  vi.stubGlobal("EventSource", MockEventSource);
  Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
  vi.mocked(getUnreadTicketSummaries).mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function render() {
  return renderHook(() => useNotifications({ userId: "user-1" }));
}

describe("useNotifications SSE watchdog", () => {
  it("recreates the EventSource after the watchdog detects a stale stream", async () => {
    const { result } = render();

    expect(MockEventSource.instances.length).toBe(1);

    act(() => {
      MockEventSource.dispatch(EventType.CONNECTED, { status: "connected" });
    });

    expect(result.current.status).toBe("connected");

    act(() => {
      vi.advanceTimersByTime(HEARTBEAT_TIMEOUT_MS + 5000);
    });

    expect(result.current.status).toBe("reconnecting");
    expect(MockEventSource.instances.length).toBe(2);
    expect(MockEventSource.instances[0].closed).toBe(true);
  });

  it("recreates the EventSource when the tab becomes visible after silence", async () => {
    const { result } = render();

    expect(MockEventSource.instances.length).toBe(1);

    act(() => {
      MockEventSource.dispatch(EventType.CONNECTED, { status: "connected" });
    });

    expect(result.current.status).toBe("connected");

    act(() => {
      vi.advanceTimersByTime(HEARTBEAT_TIMEOUT_MS + 1);
    });

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(result.current.status).toBe("reconnecting");
    expect(MockEventSource.instances.length).toBe(2);
    expect(MockEventSource.instances[0].closed).toBe(true);
  });
});
