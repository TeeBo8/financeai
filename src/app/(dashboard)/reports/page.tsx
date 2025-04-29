import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { ReportsClient } from "./client";

export default async function ReportsPage() {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin");
  }

  return <ReportsClient />;
} 