import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const subject = await prisma.subject.findUnique({ where: { slug: params.slug } });
  if (!subject || !subject.active) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }

  const slots = await prisma.availabilitySlot.findMany({
    where: {
      subjectId: subject.id,
      isBooked: false,
      startsAt: { gt: new Date() },
    },
    orderBy: { startsAt: "asc" },
    take: 200,
  });

  return NextResponse.json({ subject, slots });
}
