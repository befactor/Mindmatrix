import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { subject: true, slot: true, payment: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { slotId, notes } = await req.json();
  if (!slotId) return NextResponse.json({ error: "missingSlot" }, { status: 400 });

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const slot = await tx.availabilitySlot.findUnique({ where: { id: slotId } });
      if (!slot || slot.isBooked || slot.startsAt <= new Date()) {
        throw new Error("slotTaken");
      }

      const claimed = await tx.availabilitySlot.updateMany({
        where: { id: slotId, isBooked: false },
        data: { isBooked: true },
      });
      if (claimed.count === 0) throw new Error("slotTaken");

      return tx.booking.create({
        data: {
          userId: session.user.id,
          subjectId: slot.subjectId,
          slotId: slot.id,
          notes: notes || null,
        },
      });
    });

    return NextResponse.json({ ok: true, bookingId: booking.id });
  } catch (err) {
    if (err instanceof Error && err.message === "slotTaken") {
      return NextResponse.json({ error: "slotTaken" }, { status: 409 });
    }
    console.error("Create booking error:", err);
    return NextResponse.json({ error: "genericError" }, { status: 500 });
  }
}
