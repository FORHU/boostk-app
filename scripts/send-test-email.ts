import { env } from "@/env";
import { sendEmail } from "@/lib/email";

/**
 * Ops utility: prove the MAILER_* transport actually delivers, without going through
 * signup and the forgot-password form.
 *
 *   bun run scripts/send-test-email.ts <recipient@example.com>
 *
 * Reports which transport it used, so a run that quietly hit the dev console log
 * (MAILER_* unset or half-filled) is not mistaken for a successful delivery.
 */
async function main() {
  const [to] = process.argv.slice(2);

  if (!to) {
    console.error("Usage: bun run scripts/send-test-email.ts <recipient@example.com>");
    process.exit(1);
  }

  if (!env.mailerEnabled) {
    console.error("❌ No SMTP transport configured — MAILER_TRANSPORT_HOST, MAILER_EMAIL and MAILER_PASSWORD");
    console.error("   must all be set in .env. Nothing will be delivered; sendEmail would log to this console.");
    process.exit(1);
  }

  console.log(`Sending via ${env.MAILER_TRANSPORT_HOST}:${env.MAILER_TRANSPORT_PORT} as ${env.MAILER_EMAIL} …`);

  await sendEmail({
    to,
    subject: "Boostk SMTP test",
    text: "If you are reading this, the Boostk mail transport works and password reset can deliver.",
  });

  console.log(`✅ Accepted by the SMTP server for ${to}. Check the inbox (and the spam folder).`);
}

main().catch((error) => {
  console.error("❌ Send failed:");
  console.error(error);
  process.exit(1);
});
