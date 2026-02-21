import { prisma } from "prisma/db";

export async function generateTicketReferenceId(): Promise<string> {
  const prefix = "TK";
  // Characters that aren't easily confused (No 0, O, 1, I, L)
  const charset = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  const reference = `${prefix}-${result}`;

  const exists = await prisma.ticket.findUnique({ where: { referenceId: reference } });
  if (exists) return generateTicketReferenceId();

  return reference;
}
