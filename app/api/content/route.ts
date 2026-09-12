import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { accessibleSubjectIds } from "@/lib/access";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const subjectIds = await accessibleSubjectIds(session.user.id);
  if (subjectIds.length === 0) return NextResponse.json([]);

  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
    include: {
      contentItems: {
        select: { id: true, type: true, title: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(subjects);
}
