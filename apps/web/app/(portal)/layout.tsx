import { redirect } from "next/navigation";
import { ProtectedShell } from "@/components/auth/protected-shell";
import { AppShell } from "@/components/layout/app-shell";
import { getServerAuthToken } from "@/lib/server-auth";

export default async function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getServerAuthToken();

  if (!token) {
    redirect("/login");
  }

  return (
    <ProtectedShell>
      <AppShell>{children}</AppShell>
    </ProtectedShell>
  );
}
