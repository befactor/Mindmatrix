import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const items = await prisma.contentItem.findMany({
    include: { subject: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    items.map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      subjectName: i.subject.name,
      videoUrl: i.videoUrl,
      pdfFilename: i.pdfFilename,
      createdAt: i.createdAt,
    }))
  );
}

// multipart/form-data: subjectId, type ("VIDEO" | "PDF"), title, and either
// videoUrl (VIDEO) or file (PDF, stored as raw bytes — see README on why).
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await req.formData();
  const subjectId = form.get("subjectId");
  const type = form.get("type");
  const title = form.get("title");

  if (typeof subjectId !== "string" || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "missingFields" }, { status: 400 });
  }
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return NextResponse.json({ error: "subjectNotFound" }, { status: 400 });

  if (type === "VIDEO") {
    const videoUrl = form.get("videoUrl");
    if (typeof videoUrl !== "string" || !videoUrl.trim()) {
      return NextResponse.json({ error: "missingVideoUrl" }, { status: 400 });
    }
    const item = await prisma.contentItem.create({
      data: { subjectId, type: "VIDEO", title: title.trim(), videoUrl: videoUrl.trim() },
    });
    return NextResponse.json({ ok: true, id: item.id });
  }

  if (type === "PDF") {
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "missingFile" }, { status: 400 });
    }
    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json({ error: "notPdf" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const item = await prisma.contentItem.create({
      data: {
        subjectId,
        type: "PDF",
        title: title.trim(),
        pdfData: buffer,
        pdfMime: "application/pdf",
        pdfFilename: file.name,
      },
    });
    return NextResponse.json({ ok: true, id: item.id });
  }

  return NextResponse.json({ error: "invalidType" }, { status: 400 });
}
