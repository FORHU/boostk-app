import { describe, expect, it } from "vitest";
import { generateTicketReferenceNumber } from "./ticket.utils";

const REFERENCE_REGEX = /^TK-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

describe("generateTicketReferenceNumber", () => {
  it("always produces the TK-XXXXXX format", () => {
    for (let i = 0; i < 500; i++) {
      expect(generateTicketReferenceNumber()).toMatch(REFERENCE_REGEX);
    }
  });

  it("excludes easily confused characters (0, O, 1, I, L)", () => {
    for (let i = 0; i < 500; i++) {
      const suffix = generateTicketReferenceNumber().slice(3);
      expect(suffix).not.toMatch(/[0O1IL]/);
    }
  });

  it("does not collide within a small sample", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const ref = generateTicketReferenceNumber();
      expect(seen.has(ref)).toBe(false);
      seen.add(ref);
    }
  });
});
