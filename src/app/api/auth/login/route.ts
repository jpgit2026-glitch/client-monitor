import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function GET() {
  const employees = await db.employee.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  const { employeeId, pin } = await req.json();

  if (!employeeId || !pin) {
    return NextResponse.json({ error: "Pick your name and enter your PIN." }, { status: 400 });
  }

  const employee = await db.employee.findUnique({ where: { id: employeeId } });
  if (!employee || !employee.active) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  const ok = await bcrypt.compare(pin, employee.pinHash);
  if (!ok) {
    return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
  }

  await createSession({ sub: employee.id, name: employee.name, role: employee.role });
  return NextResponse.json({ role: employee.role });
}
