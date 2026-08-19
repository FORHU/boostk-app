const PREFIX = "TK";

// Characters that aren't easily confused (No 0, O, 1, I, L)
const CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const REFERENCE_LENGTH = 6;

export function generateTicketReferenceNumber(): string {
  let result = "";
  for (let i = 0; i < REFERENCE_LENGTH; i++) {
    result += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return `${PREFIX}-${result}`;
}
