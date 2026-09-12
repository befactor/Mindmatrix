import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "weakPasswordError" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "emailTakenError" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name: name || null, email, phone: phone || null, passwordHash },
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    // Two near-simultaneous submits can both pass the findUnique check
    // above before either insert lands - map the resulting unique
    // constraint violation to the same "email taken" error.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "emailTakenError" }, { status: 409 });
    }
    console.error("Register error:", err);
    return NextResponse.json({ error: "genericError" }, { status: 500 });
  }
}
