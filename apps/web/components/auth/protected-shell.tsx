"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, token } = useAuth();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login");
    }
  }, [loading, token, router]);

  if (loading) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <p className="portal-eyebrow">AUTH CHECK</p>
          <h1>Checking session</h1>
          <p className="page-subtitle">
            Please wait while the portal verifies your login.
          </p>
        </section>
      </main>
    );
  }

  if (!token) {
    return null;
  }

  return <>{children}</>;
}
