import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const [totalStudents, statusCounts, confirmedBookings, upcomingSlotCount] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.booking.findMany({
      where: { status: "CONFIRMED" },
      select: { subject: { select: { priceJod: true } } },
    }),
    prisma.availabilitySlot.count({ where: { isBooked: false, startsAt: { gt: new Date() } } }),
  ]);

  const confirmedRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.subject.priceJod), 0);

  const byStatus: Record<string, number> = {};
  for (const row of statusCounts) byStatus[row.status] = row._count._all;

  return NextResponse.json({
    totalStudents,
    byStatus,
    confirmedRevenue,
    confirmedCount: confirmedBookings.length,
    upcomingSlotCount,
  });
}
