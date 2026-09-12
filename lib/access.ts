import { prisma } from "@/lib/prisma";

// A student unlocks a subject's protected content once an admin has
// confirmed a CliQ payment for at least one booking in that subject —
// access doesn't expire when the booked session passes, so students can
// keep reviewing material they paid for.
export async function hasSubjectAccess(userId: string, subjectId: string): Promise<boolean> {
  const confirmed = await prisma.booking.findFirst({
    where: { userId, subjectId, status: "CONFIRMED" },
    select: { id: true },
  });
  return !!confirmed;
}

export async function accessibleSubjectIds(userId: string): Promise<string[]> {
  const bookings = await prisma.booking.findMany({
    where: { userId, status: "CONFIRMED" },
    select: { subjectId: true },
    distinct: ["subjectId"],
  });
  return bookings.map((b) => b.subjectId);
}
