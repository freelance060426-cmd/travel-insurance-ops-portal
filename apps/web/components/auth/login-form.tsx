"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";

export function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("admin@travel-ops.local");
  const [password, setPassword] = useState("admin123");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const toastId = toast.loading("Signing in...");

    try {
      await signIn({ email, password });
      toast.success("Signed in.", { id: toastId });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed.", {
        id: toastId,
      });
      setPending(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-scene">
        <div className="login-scene__overlay" />
        <div className="login-brand-block">
          <Image
            src="/brand/cover-edge-logo.png"
            alt="Cover Edge Assist"
            width={180}
            height={180}
            className="login-brand-block__logo"
            priority
          />
          <p className="portal-eyebrow">COVER EDGE ASSIST</p>
          <h1>Nature travel insurance operations, branded for daily use.</h1>
          <p className="page-subtitle">
            Manage policies, invoices, PDF dispatch, and client servicing from a
            single internal workspace with a travel-first visual identity.
          </p>
          <div className="login-scene__chips">
            <span className="portal-chip">Travel-ready operations</span>
            <span className="portal-chip">PDF + email dispatch</span>
            <span className="portal-chip">Policy + invoice management</span>
          </div>
        </div>
      </section>

      <section className="login-card">
        <Image
          src="/brand/cover-edge-logo.png"
          alt="Cover Edge Assist"
          width={88}
          height={88}
          className="login-card__logo"
          priority
        />
        <p className="portal-eyebrow">TRAVEL INSURANCE OPS</p>
        <h2>Sign in to continue</h2>
        <p className="page-subtitle">
          Use your internal account to access policy, invoice, document, and
          endorsement workflows.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="lookup-banner">
          Local default: <strong>admin@travel-ops.local</strong> /{" "}
          <strong>admin123</strong>
        </div>
      </section>
    </main>
  );
}
