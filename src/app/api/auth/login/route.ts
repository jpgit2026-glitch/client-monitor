import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { username, pin } = await req.json();

  if (!username || !pin) {
    return NextResponse.json({ error: "Enter your username and PIN." }, { status: 400 });
  }

  const employee = await db.employee.findUnique({ where: { username: String(username).toLowerCase().trim() } });
  if (!employee || !employee.active) {
    return NextResponse.json({ error: "Username not found." }, { status: 404 });
  }

  const ok = await bcrypt.compare(pin, employee.pinHash);
  if (!ok) {
    return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
  }

  await createSession({ sub: employee.id, name: employee.name, role: employee.role });
  return NextResponse.json({ role: employee.role });
}
