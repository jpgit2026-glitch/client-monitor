import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const showArchived = req.nextUrl.searchParams.get("archived") === "1";

  const where: any = { archived: showArchived };
  if (q) where.name = { contains: q, mode: "insensitive" };

  const clients = await db.client.findMany({
    where,
    include: {
      tasks: true,
      handlers: { select: { id: true, name: true, role: true } },
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const data = clients.map((c) => {
    const total = c.tasks.length;
    const completed = c.tasks.filter((t) => t.status === "COMPLETED").length;
    const overdue = c.tasks.filter(
      (t) => t.dueDate && t.dueDate < now && t.status !== "COMPLETED" && t.status !== "CANCELLED"
    ).length;
    const progress = total ? Math.round((completed / total) * 100) : 0;
    return { id: c.id, name: c.name, status: c.status, archived: c.archived, total, completed, overdue, progress, handlers: c.handlers };
  });

  return NextResponse.json({ clients: data });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["DIRECTOR", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, notes } = await req.json();
  if (!name) return NextResponse.json({ error: "Client name is required." }, { status: 400 });

  const client = await db.client.create({ data: { name, notes } });
  return NextResponse.json({ client });
}
