import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

// Expected columns (header row, any order):
// Client | Task Title | Work Role (ACCOUNTING/LIAISON) | Assigned To | Status | Due Date | Progress % | Notes

const STATUS_VALUES = ["PENDING", "IN_PROGRESS", "WAITING_FOR_CLIENT", "FOR_REVIEW", "COMPLETED", "CANCELLED"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["BOSS", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const employees = await db.employee.findMany({ where: { active: true } });
  const employeeByName = new Map(employees.map((e) => [e.name.trim().toLowerCase(), e]));

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const clientName = String(row["Client"] ?? "").trim();
    const title = String(row["Task Title"] ?? "").trim();
    const workRole = String(row["Work Role"] ?? "").trim().toUpperCase();

    if (!clientName || !title) {
      errors.push(`Row ${i + 2}: missing Client or Task Title, skipped.`);
      continue;
    }
    if (!["ACCOUNTING", "LIAISON"].includes(workRole)) {
      errors.push(`Row ${i + 2}: Work Role must be ACCOUNTING or LIAISON, skipped.`);
      continue;
    }

    const existingClient = await db.client.findFirst({ where: { name: clientName } });
    const client = existingClient ?? (await db.client.create({ data: { name: clientName } }));

    const assignedName = String(row["Assigned To"] ?? "").trim().toLowerCase();
    const assignedEmployee = assignedName ? employeeByName.get(assignedName) : undefined;

    const statusRaw = String(row["Status"] ?? "PENDING").trim().toUpperCase().replace(/\s+/g, "_");
    const status = STATUS_VALUES.includes(statusRaw) ? statusRaw : "PENDING";

    const dueDateRaw = row["Due Date"];
    const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
    const progressPct = Number(row["Progress %"]) || 0;
    const notes = String(row["Notes"] ?? "") || null;

    const existing = await db.task.findFirst({ where: { clientId: client.id, title } });

    if (existing) {
      await db.task.update({
        where: { id: existing.id },
        data: {
          workRole: workRole as any,
          assignedToId: assignedEmployee?.id ?? existing.assignedToId,
          status: status as any,
          dueDate,
          progressPct,
          notes,
        },
      });
      updated++;
    } else {
      await db.task.create({
        data: {
          title,
          clientId: client.id,
          workRole: workRole as any,
          assignedToId: assignedEmployee?.id ?? null,
          status: status as any,
          dueDate,
          progressPct,
          notes,
        },
      });
      created++;
    }
  }

  return NextResponse.json({ created, updated, errors, totalRows: rows.length });
}
