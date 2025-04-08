import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { DashboardLayout } from "~/components/layout/DashboardLayout";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return <DashboardLayout>{children}</DashboardLayout>;
} 