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
  _count: { select: { comments: true } },
  comments: { orderBy: { createdAt: "desc" as const }, take: 1, select: { createdAt: true } },
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const assignedToId = req.nextUrl.searchParams.get("assignedToId");
  const clientId = req.nextUrl.searchParams.get("clientId");
  const sortBy = req.nextUrl.searchParams.get("sort") ?? "dueDate";
  const priority = req.nextUrl.searchParams.get("priority");
  const isManager = ["DIRECTOR", "ADMIN"].includes(session.role);

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
    const readMarkers = await getReadMarkers(session.sub, tasks.map((t) => t.id));
    return NextResponse.json({ tasks: withUnread(withOverdue(tasks), readMarkers) });
  }

  const own = await db.task.findMany({
    where: {
      OR: [
        { assignees: { some: { id: session.sub } } },
        { createdById: session.sub },
      ],
      ...(clientId ? { clientId } : {}),
      ...priorityFilter,
    },
    include: taskInclude,
    orderBy,
  });
  const clientIds = [...new Set(own.map((t) => t.clientId))];
  const connected = clientIds.length
    ? await db.task.findMany({
        where: { clientId: { in: clientIds }, assignees: { none: { id: session.sub } }, ...priorityFilter },
        include: taskInclude,
        orderBy,
      })
    : [];

  const allIds = [...own, ...connected].map((t) => t.id);
  const readMarkers = await getReadMarkers(session.sub, allIds);

  // Find unread mentions for this user
  const recentMentions = await db.taskComment.findMany({
    where: {
      mentions: { some: { id: session.sub } },
      employeeId: { not: session.sub },
    },
    include: {
      task: { include: taskInclude },
      employee: { select: { id: true, name: true } },
      mentions: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const mentionReadMarkers = await getReadMarkers(
    session.sub,
    recentMentions.map((m) => m.taskId)
  );
  const unreadMentions = recentMentions.filter((m) => {
    const lastRead = mentionReadMarkers.get(m.taskId);
    return !lastRead || m.createdAt > lastRead;
  });

  return NextResponse.json({
    tasks: withUnread(withOverdue(own), readMarkers),
    connectedTasks: withUnread(withOverdue(connected), readMarkers),
    unreadMentions: unreadMentions.map((m) => ({
      commentId: m.id,
      message: m.message,
      createdAt: m.createdAt,
      by: m.employee,
      taskId: m.taskId,
      taskTitle: m.task.title,
      clientName: m.task.client?.name,
    })),
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

async function getReadMarkers(employeeId: string, taskIds: string[]) {
  if (taskIds.length === 0) return new Map<string, Date>();
  const markers = await db.taskCommentRead.findMany({
    where: { employeeId, taskId: { in: taskIds } },
  });
  return new Map(markers.map((m) => [m.taskId, m.lastReadAt]));
}

function withUnread(tasks: any[], readMarkers: Map<string, Date>) {
  return tasks.map((t) => {
    const latestComment = t.comments?.[0]?.createdAt;
    const lastRead = readMarkers.get(t.id);
    const hasUnread = !!latestComment && (!lastRead || latestComment > lastRead);
    const { comments: _comments, ...rest } = t;
    return { ...rest, hasUnread };
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const { title, clientId, assignedToIds, assignedToId, workRole, dueDate, dependsOnId, notes, priority, filePath } = body;

  if (!title || !clientId) {
    return NextResponse.json({ error: "Title and client are required." }, { status: 400 });
  }

  const ids: string[] = assignedToIds ?? (assignedToId ? [assignedToId] : []);

  let detectedRole: "ACCOUNTING" | "LIAISON" = workRole ?? "ACCOUNTING";
  if (!workRole && ids.length > 0) {
    const firstAssignee = await db.employee.findUnique({ where: { id: ids[0] }, select: { role: true } });
    if (firstAssignee?.role === "LIAISON") detectedRole = "LIAISON";
  }

  const task = await db.task.create({
    data: {
      title,
      clientId,
      assignedToId: ids[0] || null,
      currentHandlerId: ids[0] || null,
      assignees: ids.length > 0 ? { connect: ids.map((id: string) => ({ id })) } : undefined,
      createdById: session.sub,
      workRole: detectedRole,
      priority: priority || "NORMAL",
      dueDate: dueDate ? new Date(dueDate) : null,
      dependsOnId: dependsOnId || null,
      notes: notes || null,
      filePath: filePath || null,
    },
  });

  const assigneeCount = ids.length;
  await db.activityLog.create({
    data: {
      taskId: task.id,
      employeeId: session.sub,
      action: `Created task and assigned to ${assigneeCount > 0 ? `${assigneeCount} employee(s)` : "unassigned"}`,
    },
  });

  return NextResponse.json({ task });
}
