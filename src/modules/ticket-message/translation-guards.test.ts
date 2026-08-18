import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { fetchSessionId, translateText } from "@/modules/translation/forhu-chat";
import { isEcho, isNotATranslation, translateIncomingMessage } from "./ticket-message.translation";

// Stub the engine so the retry/session behaviour can be asserted without the network.
// `looksLikeEnglish` and the prompt constants are kept real — only the two calls that
// leave the process are faked.
vi.mock("@/modules/translation/forhu-chat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/translation/forhu-chat")>();
  return { ...actual, fetchSessionId: vi.fn(), translateText: vi.fn() };
});

const sessionMock = fetchSessionId as unknown as Mock;
const translateMock = translateText as unknown as Mock;

/** The exact strings the engine returned during the Korean-customer bug report. */
const REFUSALS = [
  "I'm sorry, but I can only respond in Korean as per the instructions. Would you like to ask something else?",
  "죄송하지만, 명령에 따라 한국어로만 응답할 수 있습니다. 다른 질문이 있으면 말씀해 주세요.",
  "Please provide the translation in the specified format without additional commentary.",
];

describe("isNotATranslation", () => {
  it("rejects every refusal seen in the bug report", () => {
    for (const refusal of REFUSALS) {
      expect(isNotATranslation(refusal)).toBe(true);
    }
  });

  // The guard exists to catch the engine narrating the task. It must not fire on ordinary
  // customer text that happens to be apologetic, or a real translation gets thrown away
  // and the agent is shown untranslated Korean instead.
  it("passes legitimate translations that merely sound apologetic", () => {
    for (const good of [
      "I'm sorry, but please refund me.",
      "Sorry for the late reply — the order still has not arrived.",
      "I can only pick it up on Friday.",
      "Please provide two photos.",
      "I have a question.",
      "I am testing to see if it is well understood in Korean.",
    ]) {
      expect(isNotATranslation(good)).toBe(false);
    }
  });
});

describe("isEcho", () => {
  it("catches the input coming straight back", () => {
    expect(isEcho("what can i do for you?", "what can i do for you?")).toBe(true);
  });

  // A reply differing only in capitalisation is still the untranslated original.
  it("ignores case and surrounding whitespace", () => {
    expect(isEcho("  What Can I Do For You? ", "what can i do for you?")).toBe(true);
  });

  it("does not flag a real translation", () => {
    expect(isEcho("O que posso fazer por você?", "what can i do for you?")).toBe(false);
  });
});

describe("translateIncomingMessage — engine misbehaviour", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let n = 0;
    sessionMock.mockImplementation(async () => `sess_${++n}`);
  });

  it("never stores a refusal as a translation", async () => {
    translateMock.mockResolvedValue(REFUSALS[0]);

    const result = await translateIncomingMessage("질문있어여", { ticketId: "t1" });

    // Falls back to "no translation" so the UI shows the original Korean, rather than
    // showing the agent a fabricated English answer.
    expect(result.translatedContent).toBeNull();
  });

  it("retries past a refusal and keeps the good translation", async () => {
    translateMock.mockResolvedValueOnce(REFUSALS[0]).mockResolvedValueOnce("I have a question.");

    const result = await translateIncomingMessage("질문있어여", { ticketId: "t1" });

    expect(result.translatedContent).toBe("I have a question.");
  });

  it("retries past an echo", async () => {
    translateMock.mockResolvedValueOnce("질문있어여").mockResolvedValueOnce("I have a question.");

    expect((await translateIncomingMessage("질문있어여", { ticketId: "t1" })).translatedContent).toBe(
      "I have a question.",
    );
  });

  // The regression guard for the actual root cause. Reusing one session per ticket let
  // the agent build up a persona from its own history and start answering instead of
  // translating, so every attempt must mint its own throwaway session.
  it("uses a fresh session for every attempt", async () => {
    translateMock.mockResolvedValue(REFUSALS[0]);

    await translateIncomingMessage("질문있어여", { ticketId: "t1" });

    expect(sessionMock).toHaveBeenCalledTimes(3);
    const sessionsUsed = translateMock.mock.calls.map((call) => call[2]);
    expect(new Set(sessionsUsed).size).toBe(3);
  });

  it("does not reuse a session between two separate messages on the same ticket", async () => {
    translateMock.mockResolvedValue("I have a question.");

    await translateIncomingMessage("질문있어여", { ticketId: "t1" });
    await translateIncomingMessage("사진 두장 부탁드립니다", { ticketId: "t1" });

    const [first, second] = translateMock.mock.calls.map((call) => call[2]);
    expect(first).not.toBe(second);
  });

  it("gives up after three attempts rather than looping", async () => {
    translateMock.mockResolvedValue(REFUSALS[2]);

    await translateIncomingMessage("사진 두장 부탁드립니다", { ticketId: "t1" });

    expect(translateMock).toHaveBeenCalledTimes(3);
  });

  it("survives the engine throwing and still returns a usable result", async () => {
    translateMock.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce("I have a question.");

    const result = await translateIncomingMessage("질문있어여", { ticketId: "t1" });

    expect(result.translatedContent).toBe("I have a question.");
  });
});
