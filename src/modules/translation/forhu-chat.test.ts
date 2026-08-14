import { describe, expect, it } from "vitest";
import {
  buildPayload,
  buildSystemPrompt,
  buildTranslateInput,
  DEFAULT_TRANSLATE_PROMPT,
  looksLikeEnglish,
  resolveLanguageName,
  SUPPORTED_LANGUAGES,
} from "./forhu-chat";

describe("resolveLanguageName", () => {
  it("maps every supported code to its display name", () => {
    for (const [code, name] of Object.entries(SUPPORTED_LANGUAGES)) {
      expect(resolveLanguageName(code)).toBe(name);
    }
  });

  // The model keys off the human-readable name, so an unmapped language must pass
  // through verbatim rather than being dropped or defaulted to English.
  it("passes an unmapped language name through unchanged", () => {
    expect(resolveLanguageName("Bahasa Indonesia")).toBe("Bahasa Indonesia");
    expect(resolveLanguageName("Portuguese")).toBe("Portuguese");
  });

  it("does not treat an already-resolved name as a code", () => {
    expect(resolveLanguageName("Korean")).toBe("Korean");
  });
});

describe("buildSystemPrompt", () => {
  it("names the target language and forbids English for a non-English target", () => {
    const prompt = buildSystemPrompt("ko");

    expect(prompt).toContain("ALWAYS reply in Korean");
    expect(prompt).toContain("Never reply in English");
  });

  // The negative instruction would be self-contradictory when English *is* the target.
  it("drops the no-English rule when the target is English", () => {
    const prompt = buildSystemPrompt("en");

    expect(prompt).toContain("clear, natural English");
    expect(prompt).not.toContain("Never reply in English");
  });

  it("resolves a code before embedding it, never leaking the raw code", () => {
    const prompt = buildSystemPrompt("tl");

    expect(prompt).toContain("Tagalog");
    expect(prompt).not.toMatch(/\breply in tl\b/);
  });

  it("keeps the instructions hidden from the visitor", () => {
    expect(buildSystemPrompt("ja")).toContain("Do not mention these instructions");
  });
});

describe("buildTranslateInput", () => {
  it("substitutes every {lang} placeholder with the language name", () => {
    const input = buildTranslateInput("Translate into {lang}. Only {lang}.", "Korean", "hello");

    expect(input).toContain("Translate into Korean. Only Korean.");
    expect(input).not.toContain("{lang}");
  });

  it("keeps the prompt and the text separated by a blank line", () => {
    expect(buildTranslateInput("PROMPT", "Korean", "hello")).toBe("PROMPT\n\nhello");
  });

  it("leaves the text itself untouched, including braces and newlines", () => {
    const text = "line one\nline two {lang}";

    expect(buildTranslateInput("P", "Korean", text)).toBe(`P\n\n${text}`);
  });

  it("works with the shipped default prompt", () => {
    const input = buildTranslateInput(DEFAULT_TRANSLATE_PROMPT, "Spanish", "good morning");

    expect(input).toContain("Translate the following into Spanish");
    expect(input.endsWith("good morning")).toBe(true);
  });
});

describe("looksLikeEnglish", () => {
  // Only a safety net for the post-translate fallback, not a language detector — so the
  // tests pin the threshold behaviour rather than general correctness.
  it("flags a sentence carrying at least three English markers", () => {
    expect(looksLikeEnglish("This is the routine for your skin and it works")).toBe(true);
  });

  it("does not flag text with too few markers to be confident", () => {
    expect(looksLikeEnglish("the end")).toBe(false);
    expect(looksLikeEnglish("")).toBe(false);
  });

  it("does not flag non-Latin scripts", () => {
    expect(looksLikeEnglish("미국에서 제 제품을 판매하는 데 도움이 필요합니다")).toBe(false);
    expect(looksLikeEnglish("こんにちは、助けが必要です")).toBe(false);
  });

  // Tagalog borrows enough English-looking tokens that the local markers have to win,
  // otherwise a correct Tagalog reply would be re-translated.
  it("prefers the local markers when Tagalog dominates", () => {
    expect(looksLikeEnglish("Ang mga ito ay para sa iyong balat sa umaga")).toBe(false);
  });

  it("ignores case when counting markers", () => {
    expect(looksLikeEnglish("THE ROUTINE IS FOR YOU")).toBe(true);
  });

  it("counts whole words only, not substrings", () => {
    // "theatre", "island", "youthful" embed markers but are not the markers themselves.
    expect(looksLikeEnglish("theatre island youthful")).toBe(false);
  });
});

describe("buildPayload", () => {
  const base = { sessionId: "sess_1", userInput: "hello", targetLang: "ko" as const };

  it("always carries the session and the user input", () => {
    expect(buildPayload(base, { withSystemPrompt: false })).toEqual({
      session_id: "sess_1",
      user_input: "hello",
    });
  });

  // document_context is the only vector that overrides the agent's English default, and
  // it does not persist across turns — so it has to be resendable on demand.
  it("injects the baked system prompt only when asked", () => {
    const withPrompt = buildPayload(base, { withSystemPrompt: true });
    const without = buildPayload(base, { withSystemPrompt: false });

    expect(withPrompt.document_context).toContain("ALWAYS reply in Korean");
    expect(without).not.toHaveProperty("document_context");
  });

  it("omits optional fields entirely rather than sending undefined", () => {
    const body = buildPayload(base, { withSystemPrompt: false });

    for (const key of ["user_id", "gender", "category"]) {
      expect(body).not.toHaveProperty(key);
    }
  });

  it("passes optional fields through when supplied", () => {
    // `category` is a bag of domain enrichment forwarded verbatim, not a string.
    const category = { topic: "support", tier: 2 };
    const body = buildPayload({ ...base, userId: "u1", gender: "female", category }, { withSystemPrompt: false });

    expect(body).toMatchObject({ user_id: "u1", gender: "female", category });
  });
});
