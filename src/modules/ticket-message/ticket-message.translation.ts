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
  DEFAULT_TRANSLATE_PROMPT,
  detectLanguage,
  fetchSessionId,
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
 * The forhu agent ignores the translate instruction and hands back something that is not
 * a translation roughly half the time -- with no error and no empty response, which is
 * why a plain try/catch never caught it. It is non-deterministic, so asking again on a
 * clean session usually works.
 */
const TRANSLATE_ATTEMPTS = 3;

/**
 * True when the engine handed back what we gave it -- i.e. it did not translate.
 * Compared case- and whitespace-insensitively: a reply that only differs by
 * capitalisation is still the untranslated original, and storing it as a
 * "translation" would show the visitor the support language twice.
 */
export const isEcho = (candidate: string, source: string) =>
  candidate.trim().toLowerCase() === source.trim().toLowerCase();

/**
 * Phrases that mean the engine talked ABOUT the task instead of doing it -- it answered
 * the customer, or narrated the translation instruction back at us.
 *
 * Deliberately narrow. A refusal is indistinguishable from a translation by shape, so the
 * only safe signal is meta-commentary that names the instruction or the act of replying.
 * Broad markers like a bare "I'm sorry" are excluded on purpose: a customer who writes
 * "죄송하지만 환불해 주세요" translates to "I'm sorry, but please refund me", and rejecting
 * that would throw away a correct translation.
 */
const NOT_A_TRANSLATION = [
  /\bas per the instructions?\b/i,
  /\bI can only (respond|reply|answer)\b/i,
  /\b(provide|give) the translation\b/i,
  /\btranslation in the specified format\b/i,
  /\bwould you like to ask something else\b/i,
  /명령에 따라/,
  /한국어로만 응답할 수 있습니다/,
];

export const isNotATranslation = (candidate: string) => NOT_A_TRANSLATION.some((pattern) => pattern.test(candidate));

/**
 * Translate on a throwaway session, retrying while the engine returns anything that is
 * not a translation. Returns null when every attempt failed, which callers render as "no
 * translation available" and fall back to the original text. Never throws -- a failed
 * attempt must not block the message being sent.
 *
 * A FRESH session per attempt is the load-bearing part. Sharing one session per ticket
 * (the previous design) let conversation state accumulate across both translation
 * directions and language detection, and the agent eventually adopted a persona from its
 * own history -- answering "I can only respond in Korean as per the instructions" instead
 * of translating. Measured on the five messages from that bug report: 1/5 corrupted on a
 * shared session, 0/5 on fresh ones. Translation is one-shot and stateless, so there is
 * nothing to gain from reuse; `document_context` does not persist across turns anyway.
 */
async function translateWithRetry(trimmed: string, targetLang: string, ticketId: string): Promise<string | null> {
  for (let attempt = 0; attempt < TRANSLATE_ATTEMPTS; attempt++) {
    try {
      const sessionId = await fetchSessionId();
      const candidate = await translateText(trimmed, targetLang, sessionId, TRANSLATE_SYSTEM_PROMPT);

      if (candidate && !isEcho(candidate, trimmed) && !isNotATranslation(candidate)) return candidate;
    } catch {
      // Swallow -- a transient failure on one attempt should not waste the rest.
    }
  }

  // Every attempt failed. The caller falls back to showing the original, which is safe
  // but silent, so say so here: this is the only place the failure is visible at all.
  console.error(`[translate] gave up after ${TRANSLATE_ATTEMPTS} attempts (ticket=${ticketId}, target=${targetLang})`);
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
    const translatedContent = await translateWithRetry(trimmed, targetLang, ticketId);
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
    const translatedContent = await translateWithRetry(trimmed, targetLang, ticketId);
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
    // Fresh session for the same reason translation uses one: detection asks a different
    // question, and sharing a session let the two contaminate each other.
    const sessionId = await fetchSessionId();
    const name = await detectLanguage(trimmed, sessionId);
    return name || null;
  } catch {
    // Detection failing is not fatal -- the customer's language just stays unknown and
    // agent replies go out untranslated -- but that is invisible without this.
    console.error(`[translate] language detection failed (ticket=${ticketId})`);
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
