import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const task = await db.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isManager = ["BOSS", "ADMIN"].includes(session.role);
  const isOwner = task.assignedToId === session.sub;
  if (!isManager && !isOwner) {
    return NextResponse.json({ error: "You can only update your own work." }, { status: 403 });
  }

  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  for (const key of ["status", "progressPct", "notes", "followUpDate", "result", "dueDate", "assignedToId"]) {
    if (key in body) allowed[key] = body[key];
  }
  if ("followUpDate" in allowed && allowed.followUpDate) {
    allowed.followUpDate = new Date(allowed.followUpDate as string);
  }
  if ("dueDate" in allowed && allowed.dueDate) {
    allowed.dueDate = new Date(allowed.dueDate as string);
  }
  // Only managers may reassign work
  if ("assignedToId" in allowed && !isManager) delete allowed.assignedToId;

  const updated = await db.task.update({ where: { id: params.id }, data: allowed });

  await db.activityLog.create({
    data: {
      taskId: task.id,
      employeeId: session.sub,
      action: `Updated ${Object.keys(allowed).join(", ")}`,
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
