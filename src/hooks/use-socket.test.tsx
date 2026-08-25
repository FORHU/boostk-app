// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type SocketHandler = (...args: unknown[]) => void;

type FakeSocket = {
  handlers: Map<string, SocketHandler[]>;
  anyHandler: SocketHandler | null;
  disconnect: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  on: (event: string, cb: SocketHandler) => FakeSocket;
  onAny: (cb: SocketHandler) => FakeSocket;
  emit: (event: string, ...args: unknown[]) => void;
};

const h = vi.hoisted(() => {
  const sockets: FakeSocket[] = [];

  function createSocket(): FakeSocket {
    const handlers = new Map<string, SocketHandler[]>();
    const socket: FakeSocket = {
      handlers,
      anyHandler: null,
      disconnect: vi.fn(),
      connect: vi.fn(),
      on(event, cb) {
        const list = handlers.get(event) ?? [];
        list.push(cb);
        handlers.set(event, list);
        return socket;
      },
      onAny(cb) {
        socket.anyHandler = cb;
        return socket;
      },
      emit(event, ...args) {
        for (const cb of handlers.get(event) ?? []) cb(...args);
      },
    };
    return socket;
  }

  const mockIo = vi.fn(() => {
    const socket = createSocket();
    sockets.push(socket);
    return socket;
  });

  const mockUseNotifications = vi.fn();

  return { sockets, mockIo, mockUseNotifications };
});

vi.mock("socket.io-client", () => ({
  io: h.mockIo,
}));

vi.mock("./use-notifications", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./use-notifications")>();
  return {
    ...actual,
    useNotifications: (...args: unknown[]) => h.mockUseNotifications(...args),
  };
});

vi.mock("@/modules/notification/notification.functions", () => ({
  getUnreadTicketSummaries: vi.fn().mockResolvedValue([]),
  markTicketReadFn: vi.fn(),
  markIntakeTicketReadFn: vi.fn(),
}));

import { useSocket } from "./use-socket";

beforeEach(() => {
  h.sockets.length = 0;
  h.mockIo.mockClear();
  h.mockUseNotifications.mockReset();
  h.mockUseNotifications.mockReturnValue({
    lastMessage: null,
    status: "connecting",
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
  });
  Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
});

describe("useSocket SSE fallback", () => {
  it("falls back to SSE on the very first connection failure", () => {
    renderHook(() => useSocket({ userId: "user-1" }));

    expect(h.sockets.length).toBe(1);

    act(() => {
      h.sockets[0].emit("connect_error", new Error("boom"));
    });

    expect(h.mockUseNotifications).toHaveBeenCalledWith(expect.objectContaining({ enabled: true, userId: "user-1" }));
  });

  it("falls back to SSE on a fresh identity's first failure after a user switch", () => {
    const { rerender } = renderHook(({ userId }: { userId: string }) => useSocket({ userId }), {
      initialProps: { userId: "user-1" },
    });

    expect(h.sockets.length).toBe(1);

    // user-1 connects successfully, so hasConnectedOnceRef flips to true
    act(() => {
      h.sockets[0].emit("connect");
    });

    // switch accounts: a brand new socket is created for user-2
    rerender({ userId: "user-2" });
    expect(h.sockets.length).toBe(2);

    // user-2's first failure must still trigger the SSE fallback, not "Reconnecting…"
    act(() => {
      h.sockets[1].emit("connect_error", new Error("boom"));
    });

    expect(h.mockUseNotifications).toHaveBeenCalledWith(expect.objectContaining({ enabled: true, userId: "user-2" }));
  });
});
