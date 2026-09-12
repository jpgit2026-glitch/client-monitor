import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const bossPin = await bcrypt.hash("1234", 10);
  const boss = await db.employee.upsert({
    where: { id: "seed-boss" },
    update: {},
    create: { id: "seed-boss", name: "Boss", role: "BOSS", pinHash: bossPin },
  });

  const mariaPin = await bcrypt.hash("1111", 10);
  const maria = await db.employee.upsert({
    where: { id: "seed-maria" },
    update: {},
    create: { id: "seed-maria", name: "Maria", role: "ACCOUNTING", pinHash: mariaPin },
  });

  const carloPin = await bcrypt.hash("2222", 10);
  const carlo = await db.employee.upsert({
    where: { id: "seed-carlo" },
    update: {},
    create: { id: "seed-carlo", name: "Carlo", role: "LIAISON", pinHash: carloPin },
  });

  const client = await db.client.upsert({
    where: { id: "seed-client-abc" },
    update: {},
    create: { id: "seed-client-abc", name: "ABC Construction" },
  });

  const prep = await db.task.upsert({
    where: { id: "seed-task-prep" },
    update: {},
    create: {
      id: "seed-task-prep",
      title: "Prepare BIR Registration Documents",
      clientId: client.id,
      assignedToId: maria.id,
      createdById: boss.id,
      workRole: "ACCOUNTING",
      status: "COMPLETED",
      priority: "HIGH",
      progressPct: 100,
    },
  });

  const submit = await db.task.upsert({
    where: { id: "seed-task-submit" },
    update: {},
    create: {
      id: "seed-task-submit",
      title: "Submit BIR Registration Documents",
      clientId: client.id,
      assignedToId: carlo.id,
      createdById: maria.id,
      workRole: "LIAISON",
      status: "IN_PROGRESS",
      priority: "URGENT",
      progressPct: 40,
      dependsOnId: prep.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: "Maria already prepared all documents. Please submit to BIR RDO 4. Bring the original and 2 copies.",
    },
  });

  await db.task.upsert({
    where: { id: "seed-task-followup" },
    update: {},
    create: {
      id: "seed-task-followup",
      title: "Follow Up BIR Registration",
      clientId: client.id,
      assignedToId: carlo.id,
      createdById: maria.id,
      workRole: "LIAISON",
      status: "PENDING",
      priority: "NORMAL",
      dependsOnId: submit.id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      notes: "Check registration status after 5 business days.",
    },
  });

  await db.task.upsert({
    where: { id: "seed-task-review" },
    update: {},
    create: {
      id: "seed-task-review",
      title: "Review Completed BIR Registration",
      clientId: client.id,
      assignedToId: maria.id,
      createdById: boss.id,
      workRole: "ACCOUNTING",
      status: "WAITING_FOR_CLIENT",
      priority: "NORMAL",
      dependsOnId: submit.id,
    },
  });

  // Seed some comments to demonstrate the discussion feature
  await db.taskComment.upsert({
    where: { id: "seed-comment-1" },
    update: {},
    create: {
      id: "seed-comment-1",
      taskId: submit.id,
      employeeId: maria.id,
      message: "Documents are ready in the brown envelope on my desk. Include the SEC certificate too.",
    },
  });

  await db.taskComment.upsert({
    where: { id: "seed-comment-2" },
    update: {},
    create: {
      id: "seed-comment-2",
      taskId: submit.id,
      employeeId: carlo.id,
      message: "Got it. Will head to BIR tomorrow morning. What time do they open?",
    },
  });

  await db.taskComment.upsert({
    where: { id: "seed-comment-3" },
    update: {},
    create: {
      id: "seed-comment-3",
      taskId: submit.id,
      employeeId: maria.id,
      message: "They open at 8 AM. Better arrive early, it gets crowded after 10.",
    },
  });

  console.log("Seeded:", { boss: boss.name, maria: maria.name, carlo: carlo.name });
  console.log("Sign in with: Boss / PIN 1234, Maria / PIN 1111, Carlo / PIN 2222");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
