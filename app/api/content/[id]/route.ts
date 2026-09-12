import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasSubjectAccess } from "@/lib/access";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const item = await prisma.contentItem.findUnique({
    where: { id: params.id },
    include: { subject: { select: { id: true, name: true } } },
  });
  if (!item) return NextResponse.json({ error: "notFound" }, { status: 404 });

  const allowed =
    session.user.role === "ADMIN" || (await hasSubjectAccess(session.user.id, item.subjectId));
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  return NextResponse.json({
    id: item.id,
    type: item.type,
    title: item.title,
    videoUrl: item.type === "VIDEO" ? item.videoUrl : undefined,
    subjectName: item.subject.name,
    watermark: {
      name: session.user.name || session.user.email,
      email: session.user.email,
      userId: session.user.id,
    },
  });
}
