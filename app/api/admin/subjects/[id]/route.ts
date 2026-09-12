import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { track, name, description, priceJod, active } = await req.json();

  const subject = await prisma.subject.update({
    where: { id: params.id },
    data: {
      ...(track !== undefined && { track }),
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(priceJod !== undefined && { priceJod }),
      ...(active !== undefined && { active }),
    },
  });
  return NextResponse.json({ ok: true, subject });
}
