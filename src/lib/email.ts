import { env } from "@/env";

/**
 * Single seam for outgoing mail. Today there is no mail provider wired up, so the
 * only transport is a dev console log; a real provider (SMTP, Resend, ...) plugs
 * into `sendEmail` without callers having to change.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (env.isDevelopment) {
    console.log(
      [
        "",
        "[dev-mail] Outgoing email (no mail provider configured)",
        `  To:      ${message.to}`,
        `  Subject: ${message.subject}`,
        `  Body:`,
        ...message.html.split("\n").map((line) => `    ${line}`),
        "",
      ].join("\n"),
    );
    return;
  }

  // No transport exists in production either; never silently swallow the email.
  console.error(`[mail] No mail transport configured; dropping email to ${message.to} ("${message.subject}")`);
}

export async function sendPasswordResetEmail({
  user,
  url,
}: {
  user: { email: string; name: string };
  url: string;
}): Promise<void> {
  await sendEmail({
    to: user.email,
    subject: "Reset your Boostk password",
    html: [
      `Hi ${user.name},`,
      "",
      "We received a request to reset your Boostk password. Open the link below to choose a new one:",
      "",
      url,
      "",
      "If you didn't request this, you can safely ignore this email.",
    ].join("\n"),
  });
}
