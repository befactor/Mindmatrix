import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const subjects = await prisma.subject.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(subjects);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { track, name, description, priceJod } = await req.json();
  if (!track || !name || !priceJod) {
    return NextResponse.json({ error: "missingFields" }, { status: 400 });
  }

  const base = slugify(name) || "subject";
  let slug = base;
  let n = 1;
  while (await prisma.subject.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }

  const maxSort = await prisma.subject.aggregate({ _max: { sortOrder: true } });

  const subject = await prisma.subject.create({
    data: {
      track,
      name,
      slug,
      description: description || null,
      priceJod,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json({ ok: true, subject });
}
