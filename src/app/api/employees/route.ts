import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const roleFilter = req.nextUrl.searchParams.get("role"); // ACCOUNTING | LIAISON | null
  const includeManagers = req.nextUrl.searchParams.get("all") === "1";

  const employees = await db.employee.findMany({
    where: {
      active: true,
      ...(roleFilter
        ? { role: roleFilter as "ACCOUNTING" | "LIAISON" }
        : includeManagers
        ? {}
        : { role: { in: ["ACCOUNTING", "LIAISON"] } }),
    },
    include: { tasks: true },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const data = employees.map((e) => {
    const tasks = e.tasks;
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    const overdue = tasks.filter(
      (t) => t.dueDate && t.dueDate < now && t.status !== "COMPLETED" && t.status !== "CANCELLED"
    ).length;
    const pending = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length;
    const progress = total ? Math.round((completed / total) * 100) : 0;

    return {
      id: e.id,
      name: e.name,
      role: e.role,
      total,
      completed,
      pending,
      overdue,
      progress,
    };
  });

  return NextResponse.json({ employees: data });
}

export async function POST(req: NextRequest) {
  const { name, role, pin } = await req.json();

  if (!name || !role || !pin) {
    return NextResponse.json({ error: "Name, role, and a PIN are required." }, { status: 400 });
  }
  if (!["BOSS", "ADMIN", "ACCOUNTING", "LIAISON"].includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }
  if (String(pin).length < 4) {
    return NextResponse.json({ error: "PIN should be at least 4 digits." }, { status: 400 });
  }

  const pinHash = await bcrypt.hash(String(pin), 10);
  const employee = await db.employee.create({
    data: { name, role, pinHash },
  });

  return NextResponse.json({ employee: { id: employee.id, name: employee.name, role: employee.role } });
}
