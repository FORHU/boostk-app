import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import GlobalChat from "@/components/chat-support/GlobalChat";

/**
 * Side-docked global support chat for the marketing site.
 *
 * A tab on the right edge opens a panel that slides in over the page; clicking the tab
 * again (or the × in the header) closes it, revealing the pricing and everything else
 * behind it untouched. The panel's width is draggable from its left edge.
 *
 * Closing only hides the panel. The conversation lives in the intake cookie, so reopening
 * — or returning days later — resumes exactly where the visitor left off.
 *
 * State lives in context so any element on the page can open the chat: the nav link and
 * the hero call-to-action both do, instead of navigating away to a separate widget.
 */

const MIN_WIDTH = 320;
const MAX_WIDTH = 720;
const DEFAULT_WIDTH = 420;
const WIDTH_STORAGE_KEY = "boostk:chat-panel-width";

/** Below this the panel covers the screen: a draggable side panel is unusable on a phone. */
const MOBILE_BREAKPOINT = 640;

type GlobalChatContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const GlobalChatContext = createContext<GlobalChatContextValue | null>(null);

/**
 * Opens/closes the global chat panel from anywhere inside the provider.
 * Throws rather than returning a no-op, so a button wired up outside the provider fails
 * loudly in development instead of silently doing nothing when clicked.
 */
export function useGlobalChat() {
  const ctx = useContext(GlobalChatContext);
  if (!ctx) throw new Error("useGlobalChat must be used inside <GlobalChatProvider>");
  return ctx;
}

export function GlobalChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<GlobalChatContextValue>(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
    }),
    [isOpen],
  );

  return (
    <GlobalChatContext.Provider value={value}>
      {children}
      <GlobalChatPanel />
    </GlobalChatContext.Provider>
  );
}

const clampWidth = (width: number) => {
  const ceiling = typeof window === "undefined" ? MAX_WIDTH : Math.min(MAX_WIDTH, window.innerWidth - 48);
  return Math.max(MIN_WIDTH, Math.min(width, Math.max(MIN_WIDTH, ceiling)));
};

function GlobalChatPanel() {
  const { isOpen, close, toggle } = useGlobalChat();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isMobile, setIsMobile] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Client-only: this renders during SSR, where window and localStorage do not exist.
  useEffect(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    try {
      const stored = localStorage.getItem(WIDTH_STORAGE_KEY);
      if (stored) {
        const parsed = Number(stored);
        if (Number.isFinite(parsed)) setWidth(clampWidth(parsed));
      }
    } catch {
      // Corrupt or unavailable storage (private mode, quota) — the default width is fine.
    }
  }, []);

  // A window narrowed below the stored width would otherwise leave the panel wider than
  // the viewport, with its drag edge off-screen.
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      setWidth((current) => clampWidth(current));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Escape closes the panel — expected of anything that overlays the page.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  const persistWidth = useCallback((next: number) => {
    try {
      localStorage.setItem(WIDTH_STORAGE_KEY, String(next));
    } catch {
      // Non-fatal: the panel works, it just won't remember its width.
    }
  }, []);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="global-chat-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            style={isMobile ? undefined : { width }}
            aria-label="BOOSTK support chat"
            className={
              isMobile
                ? "fixed inset-0 z-50 flex flex-col overflow-hidden bg-white"
                : "fixed right-0 top-0 z-50 flex h-screen flex-col overflow-hidden border-l border-black/10 bg-white shadow-2xl"
            }
          >
            {!isMobile && (
              <WidthGrip
                width={width}
                onResizeStart={() => setIsResizing(true)}
                onResize={setWidth}
                onResizeEnd={(final) => {
                  setIsResizing(false);
                  persistWidth(final);
                }}
              />
            )}

            {/* Pointer events are suppressed mid-drag so the chat body cannot swallow
                pointermove and strand the resize. */}
            <div className={`flex-1 min-h-0 ${isResizing ? "pointer-events-none select-none" : ""}`}>
              <GlobalChat
                headerAction={
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close chat"
                    className="rounded-lg p-1.5 text-indigo-200 transition-colors hover:bg-indigo-500/40 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                }
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Edge tab. Hidden while the panel is open on mobile, where the panel covers the
          whole screen and the tab would sit on top of it. */}
      {!(isMobile && isOpen) && (
        <button
          type="button"
          onClick={toggle}
          aria-label={isOpen ? "Close support chat" : "Open support chat"}
          aria-expanded={isOpen}
          style={isMobile || !isOpen ? undefined : { right: width }}
          className={`fixed top-1/2 z-50 flex -translate-y-1/2 items-center gap-2 rounded-l-xl bg-indigo-600 py-4 pl-3 pr-2 text-white shadow-lg transition-colors hover:bg-indigo-700 ${
            isOpen && !isMobile ? "" : "right-0"
          }`}
        >
          {isOpen ? <X size={18} /> : <MessageCircle size={18} />}
          <span className="text-xs font-semibold tracking-wide [writing-mode:vertical-rl]">
            {isOpen ? "Close" : "Chat with us"}
          </span>
        </button>
      )}
    </>
  );
}

/**
 * Drag handle on the panel's left edge. The panel is anchored right, so dragging left
 * widens it. Pointer capture keeps the drag alive when the cursor leaves the 6px strip,
 * which a plain mousemove listener on the element would not.
 */
function WidthGrip({
  width,
  onResizeStart,
  onResize,
  onResizeEnd,
}: {
  width: number;
  onResizeStart: () => void;
  onResize: (width: number) => void;
  onResizeEnd: (width: number) => void;
}) {
  const origin = useRef<{ x: number; width: number } | null>(null);
  const latest = useRef(width);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    origin.current = { x: e.clientX, width };
    onResizeStart();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!origin.current) return;
    const next = clampWidth(origin.current.width + (origin.current.x - e.clientX));
    latest.current = next;
    onResize(next);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!origin.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    origin.current = null;
    onResizeEnd(latest.current);
  };

  // Keyboard resizing, so the panel is not pointer-only.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 64 : 16;
    const delta = e.key === "ArrowLeft" ? step : e.key === "ArrowRight" ? -step : 0;
    if (!delta) return;

    e.preventDefault();
    const next = clampWidth(width + delta);
    latest.current = next;
    onResize(next);
    onResizeEnd(next); // a key press is a complete gesture — persist straight away
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      aria-label="Resize chat panel. Use left and right arrow keys to adjust."
      className="absolute left-0 top-0 z-10 h-full w-1.5 cursor-ew-resize touch-none border-0 bg-transparent p-0 transition-colors hover:bg-indigo-400/40 focus-visible:bg-indigo-400/60 focus-visible:outline-none"
    />
  );
}
