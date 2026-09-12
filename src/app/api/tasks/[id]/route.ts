import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const taskInclude = {
  client: true,
  assignedTo: { select: { id: true, name: true, role: true } },
  createdBy: { select: { id: true, name: true, role: true } },
  dependsOn: true,
  comments: {
    include: { employee: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" as const },
  },
  activityLogs: {
    include: { employee: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" as const },
    take: 20,
  },
  _count: { select: { comments: true } },
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const task = await db.task.findUnique({
    where: { id: params.id },
    include: taskInclude,
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  return NextResponse.json({
    task: {
      ...task,
      isOverdue: !!task.dueDate && task.dueDate < now && task.status !== "COMPLETED" && task.status !== "CANCELLED",
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const task = await db.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isManager = ["BOSS", "ADMIN"].includes(session.role);
  const isOwner = task.assignedToId === session.sub;
  const isCreator = task.createdById === session.sub;
  if (!isManager && !isOwner && !isCreator) {
    return NextResponse.json({ error: "You can only update tasks you own or created." }, { status: 403 });
  }

  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  const allowedKeys = ["status", "progressPct", "notes", "followUpDate", "result", "dueDate", "assignedToId", "priority", "title"];
  for (const key of allowedKeys) {
    if (key in body) allowed[key] = body[key];
  }
  if ("followUpDate" in allowed && allowed.followUpDate) {
    allowed.followUpDate = new Date(allowed.followUpDate as string);
  }
  if ("dueDate" in allowed && allowed.dueDate) {
    allowed.dueDate = new Date(allowed.dueDate as string);
  }

  const updated = await db.task.update({ where: { id: params.id }, data: allowed });

  const changes = Object.keys(allowed);
  await db.activityLog.create({
    data: {
      taskId: task.id,
      employeeId: session.sub,
      action: `Updated ${changes.join(", ")}`,
    },
  });

  return NextResponse.json({ task: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !["BOSS", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db.task.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
