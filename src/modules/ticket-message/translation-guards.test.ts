import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { fetchSessionId, parseLanguageName, translateText } from "@/modules/translation/forhu-chat";
import {
  isEcho,
  isNotATranslation,
  SUPPORT_LANGUAGE,
  shouldDetectLanguage,
  translateIncomingMessage,
  translateOutgoingMessage,
} from "./ticket-message.translation";

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

/**
 * Which way an agent's reply gets translated.
 *
 * The direction has to follow what the agent actually typed. Assuming they always write
 * the support language meant a colleague replying in Korean got their message "translated"
 * Korean->Korean, which returns a *reworded* paraphrase — not an echo, so it was stored
 * and shown to the customer as the agent's own words.
 */
describe("translateOutgoingMessage — direction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.mockResolvedValue("sess_1");
    translateMock.mockResolvedValue("translated text");
  });

  /** The language the engine was actually asked to translate into. */
  const requestedTarget = () => translateMock.mock.calls[0]?.[1];

  it("translates an agent's English reply into the customer's language", async () => {
    const result = await translateOutgoingMessage("Hello, how can I help you?", {
      ticketId: "t1",
      customerLang: "Korean",
    });

    expect(requestedTarget()).toBe("Korean");
    expect(result.targetLang).toBe("Korean");
  });

  // The reported bug. The customer must keep the agent's exact Korean, so the translation
  // goes the other way — into the support language, for colleagues who do not read Korean.
  it("translates an agent's Korean reply into the support language instead", async () => {
    const result = await translateOutgoingMessage("안녕하세요, 무엇을 도와드릴까요?", {
      ticketId: "t1",
      customerLang: "Korean",
    });

    expect(requestedTarget()).toBe(SUPPORT_LANGUAGE);
    expect(result.targetLang).toBe(SUPPORT_LANGUAGE);
  });

  it("does the same for other non-Latin scripts", async () => {
    for (const [text, lang] of [
      ["こんにちは、ご用件をお伺いします", "Japanese"],
      ["您好，我可以帮您什么", "Chinese"],
      ["Здравствуйте, чем помочь", "Russian"],
    ] as const) {
      vi.clearAllMocks();
      translateMock.mockResolvedValue("translated text");

      const result = await translateOutgoingMessage(text, { ticketId: "t1", customerLang: lang });

      expect(result.targetLang).toBe(SUPPORT_LANGUAGE);
    }
  });

  // A short reply carries too few marker words for `looksLikeEnglish`, which is why the
  // direction check uses script rather than that heuristic.
  it("treats a short English reply as the support language", async () => {
    await translateOutgoingMessage("Hi!", { ticketId: "t1", customerLang: "Korean" });

    expect(requestedTarget()).toBe("Korean");
  });

  it("skips the engine entirely when both sides already share a language", async () => {
    const result = await translateOutgoingMessage("Hello there, how are you?", {
      ticketId: "t1",
      customerLang: "English",
    });

    expect(translateMock).not.toHaveBeenCalled();
    expect(result.translatedContent).toBeNull();
  });

  it("skips the engine for an empty reply", async () => {
    await translateOutgoingMessage("   ", { ticketId: "t1", customerLang: "Korean" });

    expect(translateMock).not.toHaveBeenCalled();
  });

  // `sourceLang` is what the agent wrote, and it was previously hardcoded to the support
  // language even when they had plainly written Korean.
  it("records the language the agent actually wrote in", async () => {
    const english = await translateOutgoingMessage("Hello, how can I help?", {
      ticketId: "t1",
      customerLang: "Korean",
    });
    const korean = await translateOutgoingMessage("안녕하세요", { ticketId: "t1", customerLang: "Korean" });

    expect(english.sourceLang).toBe(SUPPORT_LANGUAGE);
    expect(korean.sourceLang).toBe("Korean");
  });
});

/**
 * Language detection has to survive the engine answering in a sentence.
 *
 * It used to keep the first run of letters, so "The language is Serbian." was stored as
 * "The" on `Customer.language` — and every later reply was translated "into The", which
 * the engine answers by handing the input straight back.
 */
describe("parseLanguageName", () => {
  it("takes the bare answer the prompt asks for", () => {
    expect(parseLanguageName("Serbian")).toBe("Serbian");
    expect(parseLanguageName("Korean.")).toBe("Korean");
  });

  it("finds the language when the engine answers in a sentence", () => {
    for (const reply of [
      "The language is Serbian.",
      "This text appears to be in Serbian.",
      "It looks like Serbian to me.",
      "  the language of the text is serbian  ",
    ]) {
      expect(parseLanguageName(reply)).toBe("Serbian");
    }
  });

  // The exact regression: the old parser returned "The" for every one of those.
  it("never returns an English filler word", () => {
    for (const reply of ["The language is Serbian.", "This is Spanish", "It is Korean"]) {
      expect(["The", "This", "It"]).not.toContain(parseLanguageName(reply));
    }
  });

  it("returns empty when no language is named, rather than guessing", () => {
    for (const reply of ["I cannot determine that.", "", "Unknown", "12345"]) {
      expect(parseLanguageName(reply)).toBe("");
    }
  });

  it("normalises casing to the canonical name", () => {
    expect(parseLanguageName("serbian")).toBe("Serbian");
    expect(parseLanguageName("JAPANESE")).toBe("Japanese");
  });
});

describe("corrupted Customer.language values", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.mockResolvedValue("sess_1");
    translateMock.mockResolvedValue("translated text");
  });

  it("does not attempt a translation into a value that is not a language", async () => {
    const result = await translateOutgoingMessage("I am the administrator", {
      ticketId: "t1",
      customerLang: "The",
    });

    expect(translateMock).not.toHaveBeenCalled();
    expect(result.translatedContent).toBeNull();
  });

  it("still translates normally for a real language", async () => {
    const result = await translateOutgoingMessage("I am the administrator", {
      ticketId: "t1",
      customerLang: "Serbian",
    });

    expect(translateMock.mock.calls[0]?.[1]).toBe("Serbian");
    expect(result.targetLang).toBe("Serbian");
  });

  // Self-healing: a customer stuck on a junk value must be re-detected, or their replies
  // stay untranslated for the life of the account.
  it("re-detects when the stored language is junk", () => {
    expect(shouldDetectLanguage("The", "gde je administrator?")).toBe(true);
  });

  it("stays locked in on a language it recognises", () => {
    expect(shouldDetectLanguage("Serbian", "gde je administrator?")).toBe(false);
    expect(shouldDetectLanguage("Korean", "안녕하세요")).toBe(false);
  });
});
