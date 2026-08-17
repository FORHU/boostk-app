import { describe, expect, it } from "vitest";
import { INTEGRATION_PROVIDERS, providerSchema } from "./integration-functions";

describe("integration provider allowlist", () => {
  it("accepts each shipped provider", () => {
    for (const provider of INTEGRATION_PROVIDERS) {
      expect(providerSchema.safeParse(provider).success).toBe(true);
    }
  });

  // `provider` is written straight to the row and forms half of the
  // `organizationId_provider` unique key, so an unvalidated value would create a record
  // the UI can neither render nor disconnect.
  it("rejects a provider outside the catalog", () => {
    for (const provider of ["openai", "telegram", "email", "sms"]) {
      expect(providerSchema.safeParse(provider).success).toBe(false);
    }
  });

  it("is case- and whitespace-sensitive rather than normalising", () => {
    for (const provider of ["WhatsApp", "SLACK", " slack", "slack "]) {
      expect(providerSchema.safeParse(provider).success).toBe(false);
    }
  });

  it("rejects empty and non-string input", () => {
    for (const provider of ["", null, undefined, 42, {}, ["slack"]]) {
      expect(providerSchema.safeParse(provider).success).toBe(false);
    }
  });

  // OpenAI was removed from the catalog in 856e1e5. If it ever reappears here without the
  // UI entry beside it, the card grid and this enum drift apart.
  it("holds exactly the three providers the catalog renders", () => {
    expect([...INTEGRATION_PROVIDERS]).toEqual(["whatsapp", "slack", "webhooks"]);
  });

  it("has no duplicate entries", () => {
    expect(new Set(INTEGRATION_PROVIDERS).size).toBe(INTEGRATION_PROVIDERS.length);
  });
});
