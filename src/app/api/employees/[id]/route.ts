import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const employee = await db.employee.findUnique({
    where: { id: params.id },
    include: {
      tasks: {
        include: {
          client: true,
          dependsOn: true,
          assignedTo: { select: { id: true, name: true, role: true } },
          createdBy: { select: { id: true, name: true, role: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    employee: { id: employee.id, name: employee.name, username: employee.username, role: employee.role },
    tasks: employee.tasks,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.active === "boolean") data.active = body.active;
  if (body.name && typeof body.name === "string") data.name = body.name.trim();
  if (body.username && typeof body.username === "string") {
    const uname = body.username.toLowerCase().trim();
    const existing = await db.employee.findUnique({ where: { username: uname } });
    if (existing && existing.id !== params.id) {
      return NextResponse.json({ error: "Username already taken." }, { status: 400 });
    }
    data.username = uname;
  }
  if (body.role && ["BOSS", "ADMIN", "ACCOUNTING", "LIAISON"].includes(body.role)) {
    data.role = body.role;
  }
  if (body.pin && String(body.pin).length >= 4) {
    data.pinHash = await bcrypt.hash(String(body.pin), 10);
  }

  const employee = await db.employee.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json({
    employee: { id: employee.id, name: employee.name, username: employee.username, role: employee.role, active: employee.active },
  });
}
