import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  await db.taskCommentRead.upsert({
    where: { taskId_employeeId: { taskId: params.id, employeeId: session.sub } },
    update: { lastReadAt: new Date() },
    create: { taskId: params.id, employeeId: session.sub },
  });

  return NextResponse.json({ ok: true });
}
