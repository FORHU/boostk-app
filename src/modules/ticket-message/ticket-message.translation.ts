// Translation layer for support chat. When a customer sends a message, we
// translate it into the support/agent language so the agent can read it, and
// cache both the original (kept in `content`) and the translation.
//
// Uses the forhu chat API as a translation engine via translateText (instruction
// in user_input). NOTE: we deliberately do NOT use the document_context system
// prompt here -- that makes the agent ANSWER the message instead of translating it.

import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import {
  clearSession,
  DEFAULT_TRANSLATE_PROMPT,
  detectLanguage,
  getSessionId,
  looksLikeEnglish,
  translateText,
} from "@/modules/translation/forhu-chat";

/** Language agents read in. Override per-deployment via SUPPORT_LANGUAGE. */
export const SUPPORT_LANGUAGE = env.SUPPORT_LANGUAGE;

/**
 * The translation "system prompt" -- kept separate from the message and editable
 * via env, then merged into user_input at the API-call boundary. `{lang}` is the
 * target language name.
 */
export const TRANSLATE_SYSTEM_PROMPT = env.TRANSLATE_SYSTEM_PROMPT ?? DEFAULT_TRANSLATE_PROMPT;

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
 * How many times to ask the engine before giving up and showing the original.
 *
 * The forhu agent ignores the translate instruction and echoes the input straight back
 * roughly half the time -- measured at 5/10 on repeated identical calls, with no error
 * and no empty response, which is why a plain try/catch never caught it.
 *
 * Crucially the failures CLUSTER: once a session has started echoing it keeps echoing,
 * so retrying on the same session barely helps (measured 5/12 still failing). Each
 * retry therefore drops the session and mints a fresh one, which is what actually
 * recovers.
 */
const TRANSLATE_ATTEMPTS = 3;

/**
 * True when the engine handed back what we gave it -- i.e. it did not translate.
 * Compared case- and whitespace-insensitively: a reply that only differs by
 * capitalisation is still the untranslated original, and storing it as a
 * "translation" would show the visitor the support language twice.
 */
const isEcho = (candidate: string, source: string) => candidate.trim().toLowerCase() === source.trim().toLowerCase();

/**
 * Translate, retrying on a fresh session while the engine echoes the input back.
 * Returns null when every attempt failed, which callers render as "no translation
 * available" and fall back to the original text. Never throws -- a failed attempt must
 * not block the message being sent.
 *
 * Takes the session *key* rather than an id precisely so it can invalidate it.
 */
async function translateWithRetry(trimmed: string, targetLang: string, sessionKey: string): Promise<string | null> {
  for (let attempt = 0; attempt < TRANSLATE_ATTEMPTS; attempt++) {
    try {
      const sessionId = await getSessionId(sessionKey);
      const candidate = await translateText(trimmed, targetLang, sessionId, TRANSLATE_SYSTEM_PROMPT);
      if (candidate && !isEcho(candidate, trimmed)) return candidate;
    } catch {
      // Swallow -- a transient failure on one attempt should not waste the rest.
    }
    // Either it echoed or it threw. Both mean this session is no longer translating
    // reliably, so bin it and let the next attempt mint a new one.
    clearSession(sessionKey);
  }
  return null;
}

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
    const translatedContent = await translateWithRetry(trimmed, targetLang, `ticket:${ticketId}`);
    if (!translatedContent) return NONE(targetLang);
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
    const translatedContent = await translateWithRetry(trimmed, targetLang, `ticket:${ticketId}`);
    if (!translatedContent) return NONE(targetLang);
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

/**
 * Everything that has to happen to a piece of inbound customer text before it is
 * stored: translate it into the support language, and remember the customer's own
 * language so replies can be translated back.
 *
 * Shared by the chat widget and by intake, so a visitor's opening line from the
 * intake form gets exactly the same treatment as everything they type afterwards.
 */
export async function prepareIncomingCustomerText({
  content,
  ticketId,
  customerId,
  customerLanguage,
}: {
  content: string;
  ticketId: string;
  customerId: string;
  customerLanguage: string | null | undefined;
}): Promise<MessageTranslation> {
  const translation = await translateIncomingMessage(content, { ticketId });

  // Keep detecting while unknown/English so an initial "hello" doesn't lock English;
  // only store an actual foreign language (English stays null, treated the same for replies).
  if (shouldDetectLanguage(customerLanguage, content)) {
    const lang = await detectMessageLanguage(content, ticketId);
    if (lang && !isSupportLanguage(lang)) {
      await prisma.customer.update({ where: { id: customerId }, data: { language: lang } });
    }
  }

  return translation;
}
