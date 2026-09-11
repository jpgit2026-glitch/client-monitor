import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || !["BOSS", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tasks = await db.task.findMany({
    include: { client: true, assignedTo: { select: { id: true, name: true, role: true } } },
    orderBy: [{ client: { name: "asc" } }, { dueDate: "asc" }],
  });

  const rows = tasks.map((t) => ({
    Client: t.client.name,
    "Task Title": t.title,
    "Work Role": t.workRole,
    "Assigned To": t.assignedTo?.name ?? "",
    Status: t.status,
    "Due Date": t.dueDate ? t.dueDate.toISOString().slice(0, 10) : "",
    "Progress %": t.progressPct,
    Notes: t.notes ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="client-work-export-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
