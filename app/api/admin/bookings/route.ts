import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const bookings = await prisma.booking.findMany({
    where: { status: { in: ["AWAITING_CONFIRMATION", "PENDING_PAYMENT"] } },
    include: { subject: true, slot: true, payment: true, user: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(bookings);
}
