import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "LIAISON") redirect("/liaison");
  if (["DIRECTOR", "ADMIN"].includes(session.role)) redirect("/boss");
  redirect("/dashboard");
}
