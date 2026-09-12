import { NextRequest, NextResponse } from "next/server";
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
    employee: { id: employee.id, name: employee.name, role: employee.role },
    tasks: employee.tasks,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { active } = await req.json();
  const employee = await db.employee.update({
    where: { id: params.id },
    data: { active },
  });
  return NextResponse.json({ employee: { id: employee.id, active: employee.active } });
}
