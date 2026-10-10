import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const taskInclude = {
  client: true,
  assignees: { select: { id: true, name: true, role: true } },
  assignedTo: { select: { id: true, name: true, role: true } },
  currentHandler: { select: { id: true, name: true, role: true } },
  createdBy: { select: { id: true, name: true, role: true } },
  dependsOn: true,
  comments: {
    include: {
      employee: { select: { id: true, name: true, role: true } },
      mentions: { select: { id: true, name: true } },
    },
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

  const task = await db.task.findUnique({ where: { id: params.id }, include: { assignees: { select: { id: true } } } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });


  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  const allowedKeys = ["status", "progressPct", "notes", "filePath", "followUpDate", "result", "dueDate", "assignedToId", "currentHandlerId", "priority", "title"];
  for (const key of allowedKeys) {
    if (key in body) allowed[key] = body[key];
  }
  if ("followUpDate" in allowed && allowed.followUpDate) {
    allowed.followUpDate = new Date(allowed.followUpDate as string);
  }
  if ("dueDate" in allowed && allowed.dueDate) {
    allowed.dueDate = new Date(allowed.dueDate as string);
  }

  const assigneesUpdate = body.assignedToIds
    ? { assignees: { set: body.assignedToIds.map((id: string) => ({ id })) }, assignedToId: body.assignedToIds[0] || null }
    : {};

  const updated = await db.task.update({ where: { id: params.id }, data: { ...allowed, ...assigneesUpdate } });

  const changes = Object.keys(allowed);
  let actionMsg = `Updated ${changes.join(", ")}`;
  if ("currentHandlerId" in allowed && allowed.currentHandlerId) {
    const handler = await db.employee.findUnique({ where: { id: allowed.currentHandlerId as string }, select: { name: true } });
    if (handler) actionMsg = `Passed task to ${handler.name}`;
  }
  await db.activityLog.create({
    data: {
      taskId: task.id,
      employeeId: session.sub,
      action: actionMsg,
    },
  });

  return NextResponse.json({ task: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !["DIRECTOR", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db.task.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
