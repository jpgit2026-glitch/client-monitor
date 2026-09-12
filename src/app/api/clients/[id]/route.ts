import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const client = await db.client.findUnique({
    where: { id: params.id },
    include: {
      tasks: {
        include: {
          assignedTo: { select: { id: true, name: true, role: true } },
          createdBy: { select: { id: true, name: true, role: true } },
          dependsOn: true,
          _count: { select: { comments: true } },
        },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const withOverdue = client.tasks.map((t) => ({
    ...t,
    isOverdue: !!t.dueDate && t.dueDate < now && t.status !== "COMPLETED" && t.status !== "CANCELLED",
  }));

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
    client: { id: client.id, name: client.name, status: client.status, notes: client.notes },
    overallProgress,
    accounting: summarize("ACCOUNTING"),
    liaison: summarize("LIAISON"),
    tasks: withOverdue,
  });
}
