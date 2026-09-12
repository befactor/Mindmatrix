import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { cliqReference, senderName, proofNote } = await req.json();
  if (!cliqReference || !String(cliqReference).trim()) {
    return NextResponse.json({ error: "missingReference" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { subject: true, payment: true },
  });
  if (!booking) return NextResponse.json({ error: "notFound" }, { status: 404 });
  if (booking.userId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (booking.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "wrongStatus" }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        bookingId: booking.id,
        amountJod: booking.subject.priceJod,
        cliqReference: String(cliqReference).trim(),
        senderName: senderName || null,
        proofNote: proofNote || null,
      },
    }),
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: "AWAITING_CONFIRMATION" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
