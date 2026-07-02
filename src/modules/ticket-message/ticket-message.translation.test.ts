import { describe, expect, it } from "vitest";
import { shouldDetectLanguage, translateIncomingMessage, translateOutgoingMessage } from "./ticket-message.translation";

describe("shouldDetectLanguage (don't lock English on the first message)", () => {
  it("detects when language is unknown and the message is foreign", () => {
    expect(shouldDetectLanguage(null, "안녕하세요, 제 주문이 아직 안 왔어요")).toBe(true);
  });

  it("skips when the message already looks like the support language", () => {
    expect(shouldDetectLanguage(null, "The order is late and you should check the tracking")).toBe(false);
  });

  it("re-detects when stored language is still English but a foreign message arrives", () => {
    expect(shouldDetectLanguage("English", "안녕하세요, 확인 부탁드립니다")).toBe(true);
  });

  it("stops once a non-support language is locked in", () => {
    expect(shouldDetectLanguage("Korean", "anything at all")).toBe(false);
  });
});

// These cases short-circuit before any network call, so they're safe in CI.
describe("translateIncomingMessage (offline short-circuits)", () => {
  it("returns no translation for empty/whitespace content", async () => {
    const r = await translateIncomingMessage("   ", { ticketId: "t1" });
    expect(r.translatedContent).toBeNull();
    expect(r.targetLang).toBe("en");
  });

  it("skips translation when the message already looks English", async () => {
    const r = await translateIncomingMessage(
      "The order has not arrived and you should check the tracking",
      { ticketId: "t1" },
    );
    expect(r.translatedContent).toBeNull();
    expect(r.sourceLang).toBe("en");
  });
});

describe("translateOutgoingMessage (agent -> customer, offline short-circuits)", () => {
  it("skips when the customer's language is English", async () => {
    const r = await translateOutgoingMessage("Hello, how can I help?", { ticketId: "t1", customerLang: "English" });
    expect(r.translatedContent).toBeNull();
  });

  it("skips when the customer's language is unknown/empty", async () => {
    const r = await translateOutgoingMessage("Hello", { ticketId: "t1", customerLang: null });
    expect(r.translatedContent).toBeNull();
  });
});
