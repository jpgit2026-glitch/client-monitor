import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const client = await db.client.findUnique({
    where: { id: params.id },
    include: {
      tasks: {
        include: {
          assignedTo: { select: { id: true, name: true, role: true } },
          createdBy: { select: { id: true, name: true, role: true } },
          dependsOn: true,
          _count: { select: { comments: true } },
          comments: { orderBy: { createdAt: "desc" as const }, take: 1, select: { createdAt: true } },
        },
        orderBy: { dueDate: "asc" },
      },
      handlers: { select: { id: true, name: true, role: true } },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const taskIds = client.tasks.map((t) => t.id);
  const readMarkers = session && taskIds.length > 0
    ? await db.taskCommentRead.findMany({
        where: { employeeId: session.sub, taskId: { in: taskIds } },
      })
    : [];
  const readMap = new Map(readMarkers.map((m) => [m.taskId, m.lastReadAt]));

  const now = new Date();
  const withOverdue = client.tasks.map((t) => {
    const latestComment = t.comments?.[0]?.createdAt;
    const lastRead = readMap.get(t.id);
    const hasUnread = !!latestComment && (!lastRead || latestComment > lastRead);
    const { comments: _comments, ...rest } = t;
    return {
      ...rest,
      hasUnread,
      isOverdue: !!t.dueDate && t.dueDate < now && t.status !== "COMPLETED" && t.status !== "CANCELLED",
    };
  });

  const summarize = (role: "ACCOUNTING" | "LIAISON") => {
    const tasks = withOverdue.filter((t) => t.workRole === role);
    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "COMPLETED").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      pending: tasks.filter((t) => t.status === "PENDING").length,
      overdue: tasks.filter((t) => t.isOverdue).length,
    };
  };

  const total = withOverdue.length;
  const completed = withOverdue.filter((t) => t.status === "COMPLETED").length;
  const overallProgress = total ? Math.round((completed / total) * 100) : 0;

  return NextResponse.json({
    client: { id: client.id, name: client.name, status: client.status, notes: client.notes, handlers: client.handlers },
    overallProgress,
    accounting: summarize("ACCOUNTING"),
    liaison: summarize("LIAISON"),
    tasks: withOverdue,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !["DIRECTOR", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { addHandler, removeHandler, archived } = body;

  if (typeof archived === "boolean") {
    await db.client.update({
      where: { id: params.id },
      data: { archived },
    });
    return NextResponse.json({ ok: true, archived });
  }

  if (addHandler) {
    await db.client.update({
      where: { id: params.id },
      data: { handlers: { connect: { id: addHandler } } },
    });
  }

  if (removeHandler) {
    await db.client.update({
      where: { id: params.id },
      data: { handlers: { disconnect: { id: removeHandler } } },
    });
  }

  const updated = await db.client.findUnique({
    where: { id: params.id },
    include: { handlers: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json({ handlers: updated?.handlers ?? [] });
}
