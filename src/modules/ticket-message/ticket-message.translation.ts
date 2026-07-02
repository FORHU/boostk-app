// Translation layer for support chat. When a customer sends a message, we
// translate it into the support/agent language so the agent can read it, and
// cache both the original (kept in `content`) and the translation.
//
// Uses the forhu chat API as a translation engine via translateText (instruction
// in user_input). NOTE: we deliberately do NOT use the document_context system
// prompt here -- that makes the agent ANSWER the message instead of translating it.

import {
  DEFAULT_TRANSLATE_PROMPT,
  detectLanguage,
  getSessionId,
  looksLikeEnglish,
  translateText,
} from "@/modules/translation/forhu-chat";

/** Language agents read in. Override per-deployment via SUPPORT_LANGUAGE. */
export const SUPPORT_LANGUAGE = process.env.SUPPORT_LANGUAGE || "en";

/**
 * The translation "system prompt" -- kept separate from the message and editable
 * via env, then merged into user_input at the API-call boundary. `{lang}` is the
 * target language name.
 */
export const TRANSLATE_SYSTEM_PROMPT = process.env.TRANSLATE_SYSTEM_PROMPT || DEFAULT_TRANSLATE_PROMPT;

export interface MessageTranslation {
  /** Support-language version, or null when no translation was needed/possible. */
  translatedContent: string | null;
  /** Best-effort source language ("en" when we detected it was already English). */
  sourceLang: string | null;
  targetLang: string;
}

const NONE = (targetLang: string): MessageTranslation => ({
  translatedContent: null,
  sourceLang: null,
  targetLang,
});

/**
 * Translate an inbound customer message into the support language.
 * Never throws -- translation is best-effort and must not block message creation.
 */
export async function translateIncomingMessage(
  content: string,
  { ticketId, targetLang = SUPPORT_LANGUAGE }: { ticketId: string; targetLang?: string },
): Promise<MessageTranslation> {
  const trimmed = content.trim();
  if (!trimmed) return NONE(targetLang);

  // Already in the support language? Skip the round-trip. (Heuristic only knows English.)
  if (targetLang === "en" && looksLikeEnglish(trimmed)) {
    return { translatedContent: null, sourceLang: "en", targetLang };
  }

  try {
    // One forhu session per ticket keeps the conversation coherent and cheap.
    const sessionId = await getSessionId(`ticket:${ticketId}`);
    const translatedContent = await translateText(trimmed, targetLang, sessionId, TRANSLATE_SYSTEM_PROMPT);
    // If the engine echoed the input back, treat it as already-translated.
    if (!translatedContent || translatedContent === trimmed) return NONE(targetLang);
    return { translatedContent, sourceLang: null, targetLang };
  } catch {
    return NONE(targetLang);
  }
}

/** True when a language is effectively the support language (no translation needed). */
export function isSupportLanguage(lang: string): boolean {
  const l = lang.trim().toLowerCase();
  return l === "" || l === "en" || l === "english" || l === SUPPORT_LANGUAGE.toLowerCase();
}

/**
 * Whether to (re)detect the customer's language for this message. We keep detecting
 * while the stored language is unknown or still the support language, so an initial
 * English "hello" doesn't lock the customer to English -- a later foreign-language
 * message overrides it. Once a non-support language is stored, we stop (locked in).
 * Skips detection when the message itself already looks like the support language.
 */
export function shouldDetectLanguage(current: string | null | undefined, content: string): boolean {
  if (current && !isSupportLanguage(current)) return false;
  return !looksLikeEnglish(content);
}

/**
 * Translate an outbound AGENT reply (written in the support language) into the
 * customer's language so they can read it. Skips when the customer's language is
 * the support language or unknown. Never throws.
 */
export async function translateOutgoingMessage(
  content: string,
  { ticketId, customerLang }: { ticketId: string; customerLang: string | null | undefined },
): Promise<MessageTranslation> {
  const trimmed = content.trim();
  const targetLang = (customerLang ?? "").trim();
  if (!trimmed || isSupportLanguage(targetLang)) return NONE(targetLang || SUPPORT_LANGUAGE);

  try {
    const sessionId = await getSessionId(`ticket:${ticketId}`);
    const translatedContent = await translateText(trimmed, targetLang, sessionId, TRANSLATE_SYSTEM_PROMPT);
    if (!translatedContent || translatedContent === trimmed) return NONE(targetLang);
    return { translatedContent, sourceLang: SUPPORT_LANGUAGE, targetLang };
  } catch {
    return NONE(targetLang);
  }
}

/**
 * Best-effort detection of a message's language (English name, e.g. "Korean").
 * Used to remember a customer's language so agent replies can be translated back
 * into it. Returns null on empty input or failure.
 */
export async function detectMessageLanguage(content: string, ticketId: string): Promise<string | null> {
  const trimmed = content.trim();
  if (!trimmed) return null;
  try {
    const sessionId = await getSessionId(`ticket:${ticketId}`);
    const name = await detectLanguage(trimmed, sessionId);
    return name || null;
  } catch {
    return null;
  }
}
