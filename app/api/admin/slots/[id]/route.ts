import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const slot = await prisma.availabilitySlot.findUnique({ where: { id: params.id } });
  if (!slot) return NextResponse.json({ error: "notFound" }, { status: 404 });
  if (slot.isBooked) return NextResponse.json({ error: "slotBooked" }, { status: 409 });

  await prisma.availabilitySlot.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
