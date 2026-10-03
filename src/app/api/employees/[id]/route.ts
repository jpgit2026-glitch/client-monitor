import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const employee = await db.employee.findUnique({
    where: { id: params.id },
    include: {
      assignedTasks: {
        include: {
          client: true,
          dependsOn: true,
          assignedTo: { select: { id: true, name: true, role: true } },
          createdBy: { select: { id: true, name: true, role: true } },
          _count: { select: { comments: true } },
          comments: { orderBy: { createdAt: "desc" as const }, take: 1, select: { createdAt: true } },
        },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const taskIds = employee.assignedTasks.map((t) => t.id);
  const readMarkers = session && taskIds.length > 0
    ? await db.taskCommentRead.findMany({
        where: { employeeId: session.sub, taskId: { in: taskIds } },
      })
    : [];
  const readMap = new Map(readMarkers.map((m) => [m.taskId, m.lastReadAt]));

  const tasks = employee.assignedTasks.map((t) => {
    const latestComment = t.comments?.[0]?.createdAt;
    const lastRead = readMap.get(t.id);
    const hasUnread = !!latestComment && (!lastRead || latestComment > lastRead);
    const { comments: _comments, ...rest } = t;
    return { ...rest, hasUnread };
  });

  return NextResponse.json({
    employee: { id: employee.id, name: employee.name, username: employee.username, role: employee.role },
    tasks,
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
  if (body.role && ["DIRECTOR", "ADMIN", "ACCOUNTING", "LIAISON", "IT", "HR"].includes(body.role)) {
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
