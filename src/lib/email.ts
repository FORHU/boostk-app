import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/env";

/**
 * Single seam for outgoing mail. `sendEmail` is the only place that knows how a
 * message leaves the process, so swapping SMTP for an API provider (Resend, ...)
 * is a change here and nowhere else.
 *
 * Transport selection:
 *   - `MAILER_*` configured  -> real SMTP send
 *   - otherwise, development -> logged to the server console
 *   - otherwise, production  -> logged as an error and dropped. `env.ts` warns about this
 *                               at boot; the app deliberately still starts, so the drop
 *                               has to be noisy per message rather than assumed impossible.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain-text body. Always sent -- some clients render nothing else. */
  text: string;
  /** Optional HTML alternative. Falls back to `text` in a <pre> when omitted. */
  html?: string;
}

/**
 * Built once and reused: nodemailer pools connections per transporter, and creating
 * one per message means a fresh TLS handshake on every send. Lazy rather than
 * module-level so importing this file (tests, the dev console path) never opens a
 * socket it does not need.
 */
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.MAILER_TRANSPORT_HOST,
    port: env.MAILER_TRANSPORT_PORT,
    // `false` on 587 means STARTTLS is negotiated after connecting, not that the
    // connection stays plaintext.
    secure: env.MAILER_TRANSPORT_SECURE,
    auth: {
      user: env.MAILER_EMAIL,
      pass: env.MAILER_PASSWORD,
    },
  });

  return transporter;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!env.mailerEnabled) {
    // The body is printed either way -- in dev it IS the delivery mechanism, and in
    // production it is the only chance an operator has to recover the reset link for a
    // locked-out user. `console.error` in production so it lands wherever errors are
    // collected, rather than looking like routine chatter.
    const log = env.isProduction ? console.error : console.log;
    const heading = env.isProduction
      ? "[mail] DROPPED — no MAILER_* transport configured; this email was NOT delivered"
      : "[dev-mail] Outgoing email (no MAILER_* transport configured)";

    log(
      [
        "",
        heading,
        `  To:      ${message.to}`,
        `  Subject: ${message.subject}`,
        `  Body:`,
        ...message.text.split("\n").map((line) => `    ${line}`),
        "",
      ].join("\n"),
    );
    return;
  }

  // Deliberately not caught: a failed reset email must surface as a failed request
  // rather than a success the user waits on forever.
  await getTransporter().sendMail({
    from: `Boostk <${env.MAILER_EMAIL}>`,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

export async function sendPasswordResetEmail({
  user,
  url,
}: {
  user: { email: string; name: string };
  url: string;
}): Promise<void> {
  const lines = [
    `Hi ${user.name},`,
    "",
    "We received a request to reset your Boostk password. Open the link below to choose a new one:",
    "",
    url,
    "",
    "This link expires in one hour. If you didn't request this, you can safely ignore this email.",
  ];

  await sendEmail({
    to: user.email,
    subject: "Reset your Boostk password",
    text: lines.join("\n"),
    // Kept to inline styles and a table-free layout on purpose: mail clients strip
    // <style> blocks and external CSS, so anything richer degrades unpredictably.
    html: [
      `<p>Hi ${escapeHtml(user.name)},</p>`,
      "<p>We received a request to reset your Boostk password. Choose a new one here:</p>",
      `<p><a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 18px;background:#1447e6;color:#ffffff;border-radius:6px;text-decoration:none">Reset password</a></p>`,
      `<p style="color:#555">Or paste this link into your browser:<br><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`,
      `<p style="color:#555">This link expires in one hour. If you didn't request this, you can safely ignore this email.</p>`,
    ].join("\n"),
  });
}

/** Names and URLs are interpolated into the HTML body; neither is trusted markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
