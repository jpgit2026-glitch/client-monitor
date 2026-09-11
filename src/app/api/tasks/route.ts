import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const assignedToId = req.nextUrl.searchParams.get("assignedToId");
  const clientId = req.nextUrl.searchParams.get("clientId");
  const isManager = ["BOSS", "ADMIN"].includes(session.role);

  // Managers can see everything, or filter by a specific employee/client.
  if (isManager) {
    const tasks = await db.task.findMany({
      where: {
        ...(assignedToId ? { assignedToId } : {}),
        ...(clientId ? { clientId } : {}),
      },
      include: { client: true, assignedTo: { select: { id: true, name: true, role: true } }, dependsOn: true },
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json({ tasks: withOverdue(tasks) });
  }

  // Non-managers: their own tasks, plus tasks on the same clients (connected work),
  // never other employees' unrelated work.
  const own = await db.task.findMany({
    where: { assignedToId: session.sub, ...(clientId ? { clientId } : {}) },
    include: { client: true, assignedTo: { select: { id: true, name: true, role: true } }, dependsOn: true },
  });
  const clientIds = [...new Set(own.map((t) => t.clientId))];
  const connected = clientIds.length
    ? await db.task.findMany({
        where: { clientId: { in: clientIds }, assignedToId: { not: session.sub } },
        include: { client: true, assignedTo: { select: { id: true, name: true, role: true } }, dependsOn: true },
      })
    : [];

  return NextResponse.json({
    tasks: withOverdue(own),
    connectedTasks: withOverdue(connected),
  });
}

function withOverdue(tasks: any[]) {
  const now = new Date();
  return tasks.map((t) => ({
    ...t,
    isOverdue: !!t.dueDate && t.dueDate < now && t.status !== "COMPLETED" && t.status !== "CANCELLED",
  }));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["BOSS", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, clientId, assignedToId, workRole, dueDate, dependsOnId, notes } = body;

  if (!title || !clientId || !workRole) {
    return NextResponse.json({ error: "Title, client, and work role are required." }, { status: 400 });
  }

  const task = await db.task.create({
    data: {
      title,
      clientId,
      assignedToId: assignedToId || null,
      workRole,
      dueDate: dueDate ? new Date(dueDate) : null,
      dependsOnId: dependsOnId || null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ task });
}
