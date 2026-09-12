import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasSubjectAccess } from "@/lib/access";

// Serves raw PDF bytes only to an entitled, authenticated request — never a
// public static file. The client fetches this via JS and renders it to a
// watermarked <canvas> (see app/learn/[slug]/p/[id]/page.tsx), so the
// browser's native PDF viewer/download button never appears.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const item = await prisma.contentItem.findUnique({ where: { id: params.id } });
  if (!item || item.type !== "PDF" || !item.pdfData) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }

  const allowed =
    session.user.role === "ADMIN" || (await hasSubjectAccess(session.user.id, item.subjectId));
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  return new NextResponse(new Uint8Array(item.pdfData), {
    headers: {
      "Content-Type": item.pdfMime || "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "no-store",
    },
  });
}
