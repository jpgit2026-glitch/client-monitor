import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const comments = await db.taskComment.findMany({
    where: { taskId: params.id },
    include: { employee: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const task = await db.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const { message } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const comment = await db.taskComment.create({
    data: {
      taskId: params.id,
      employeeId: session.sub,
      message: message.trim(),
    },
    include: { employee: { select: { id: true, name: true, role: true } } },
  });

  await db.activityLog.create({
    data: {
      taskId: params.id,
      employeeId: session.sub,
      action: "Added a comment",
    },
  });

  return NextResponse.json({ comment });
}
