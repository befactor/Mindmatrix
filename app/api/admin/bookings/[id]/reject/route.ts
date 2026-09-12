import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { reason } = await req.json().catch(() => ({ reason: null }));

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking) return NextResponse.json({ error: "notFound" }, { status: 404 });
  if (booking.status !== "AWAITING_CONFIRMATION" && booking.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "wrongStatus" }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.booking.update({ where: { id: booking.id }, data: { status: "REJECTED" } }),
    prisma.availabilitySlot.update({ where: { id: booking.slotId }, data: { isBooked: false } }),
    prisma.payment.updateMany({
      where: { bookingId: booking.id },
      data: { reviewedBy: admin.user.id, reviewedAt: new Date(), rejectionReason: reason || null },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
