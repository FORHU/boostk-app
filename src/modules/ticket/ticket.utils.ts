const PREFIX = "TK";

// Characters that aren't easily confused (No 0, O, 1, I, L)
const CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const REFERENCE_LENGTH = 6;

// The reference number IS the conversation's bearer credential — it authorizes reading,
// posting, rating and closing — so it must come from a CSPRNG. Math.random() is
// predictable (xorshift128+ state recoverable from a handful of outputs), which would let
// an attacker mint other visitors' reference numbers.
const REJECT_ABOVE = Math.floor(256 / CHARSET.length) * CHARSET.length;

export function generateTicketReferenceNumber(): string {
  let result = "";
  while (result.length < REFERENCE_LENGTH) {
    const bytes = crypto.getRandomValues(new Uint8Array(REFERENCE_LENGTH * 2));
    for (let i = 0; i < bytes.length && result.length < REFERENCE_LENGTH; i++) {
      // Rejection sampling: dropping the tail keeps every character equally likely,
      // since 256 is not a multiple of the charset length.
      if (bytes[i] >= REJECT_ABOVE) continue;
      result += CHARSET.charAt(bytes[i] % CHARSET.length);
    }
  }
  return `${PREFIX}-${result}`;
}
