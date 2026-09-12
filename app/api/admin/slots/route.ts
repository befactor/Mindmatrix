import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const slots = await prisma.availabilitySlot.findMany({
    where: { startsAt: { gt: new Date() } },
    include: { subject: true },
    orderBy: { startsAt: "asc" },
    take: 200,
  });
  return NextResponse.json(slots);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { subjectId, startsAt, endsAt } = await req.json();
  if (!subjectId || !startsAt || !endsAt) {
    return NextResponse.json({ error: "missingFields" }, { status: 400 });
  }
  const starts = new Date(startsAt);
  const ends = new Date(endsAt);
  if (isNaN(starts.getTime()) || isNaN(ends.getTime()) || ends <= starts) {
    return NextResponse.json({ error: "invalidRange" }, { status: 400 });
  }

  const slot = await prisma.availabilitySlot.create({
    data: { subjectId, startsAt: starts, endsAt: ends },
  });
  return NextResponse.json({ ok: true, slot });
}
