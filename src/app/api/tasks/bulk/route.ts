import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const { ids, status } = body;

  if (!Array.isArray(ids) || ids.length === 0 || !status) {
    return NextResponse.json({ error: "ids (array) and status are required." }, { status: 400 });
  }

  const validStatuses = ["PENDING", "IN_PROGRESS", "WAITING_FOR_CLIENT", "FOR_REVIEW", "COMPLETED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const isManager = ["DIRECTOR", "ADMIN"].includes(session.role);

  let where;
  if (isManager) {
    where = { id: { in: ids } };
  } else {
    const userClientIds = await db.task.findMany({
      where: { assignees: { some: { id: session.sub } } },
      select: { clientId: true },
      distinct: ["clientId"],
    });
    const clientIds = userClientIds.map((t) => t.clientId);

    where = {
      id: { in: ids },
      OR: [
        { assignees: { some: { id: session.sub } } },
        { createdById: session.sub },
        { clientId: { in: clientIds } },
      ],
    };
  }

  const result = await db.task.updateMany({ where, data: { status } });

  for (const id of ids) {
    await db.activityLog.create({
      data: {
        taskId: id,
        employeeId: session.sub,
        action: `Bulk updated status to ${status}`,
      },
    }).catch(() => {});
  }

  return NextResponse.json({ updated: result.count });
}
