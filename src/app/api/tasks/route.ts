import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const taskInclude = {
  client: true,
  assignedTo: { select: { id: true, name: true, role: true } },
  createdBy: { select: { id: true, name: true, role: true } },
  dependsOn: true,
  _count: { select: { comments: true } },
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const assignedToId = req.nextUrl.searchParams.get("assignedToId");
  const clientId = req.nextUrl.searchParams.get("clientId");
  const sortBy = req.nextUrl.searchParams.get("sort") ?? "dueDate";
  const priority = req.nextUrl.searchParams.get("priority");
  const isManager = ["BOSS", "ADMIN"].includes(session.role);

  const orderBy = buildOrderBy(sortBy);
  const priorityFilter = priority ? { priority: priority as any } : {};

  if (isManager) {
    const tasks = await db.task.findMany({
      where: {
        ...(assignedToId ? { assignedToId } : {}),
        ...(clientId ? { clientId } : {}),
        ...priorityFilter,
      },
      include: taskInclude,
      orderBy,
    });
    return NextResponse.json({ tasks: withOverdue(tasks) });
  }

  const own = await db.task.findMany({
    where: { assignedToId: session.sub, ...(clientId ? { clientId } : {}), ...priorityFilter },
    include: taskInclude,
    orderBy,
  });
  const clientIds = [...new Set(own.map((t) => t.clientId))];
  const connected = clientIds.length
    ? await db.task.findMany({
        where: { clientId: { in: clientIds }, assignedToId: { not: session.sub }, ...priorityFilter },
        include: taskInclude,
        orderBy,
      })
    : [];

  return NextResponse.json({
    tasks: withOverdue(own),
    connectedTasks: withOverdue(connected),
  });
}

function buildOrderBy(sortBy: string) {
  switch (sortBy) {
    case "priority":
      return [{ priority: "asc" as const }, { dueDate: "asc" as const }];
    case "created":
      return { createdAt: "desc" as const };
    case "progress":
      return { progressPct: "desc" as const };
    default:
      return { dueDate: "asc" as const };
  }
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
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const { title, clientId, assignedToId, workRole, dueDate, dependsOnId, notes, priority } = body;

  if (!title || !clientId || !workRole) {
    return NextResponse.json({ error: "Title, client, and work role are required." }, { status: 400 });
  }

  const task = await db.task.create({
    data: {
      title,
      clientId,
      assignedToId: assignedToId || null,
      createdById: session.sub,
      workRole,
      priority: priority || "NORMAL",
      dueDate: dueDate ? new Date(dueDate) : null,
      dependsOnId: dependsOnId || null,
      notes: notes || null,
    },
  });

  await db.activityLog.create({
    data: {
      taskId: task.id,
      employeeId: session.sub,
      action: `Created task and assigned to ${assignedToId ? "employee" : "unassigned"}`,
    },
  });

  return NextResponse.json({ task });
}
