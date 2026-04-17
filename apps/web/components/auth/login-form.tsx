"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("admin@travel-ops.local");
  const [password, setPassword] = useState("admin123");
  const [state, setState] = useState<{
    status: "idle" | "loading" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading", message: "Signing in..." });

    try {
      await signIn({ email, password });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Login failed.",
      });
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="portal-eyebrow">TRAVEL INSURANCE OPS</p>
        <h1>Sign in to continue</h1>
        <p className="page-subtitle">
          Use the internal account to access partners, policies, invoices, and
          endorsement workflows.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {state.status !== "idle" ? (
            <div className={`submit-banner submit-${state.status === "error" ? "error" : "saving"}`}>
              {state.message}
            </div>
          ) : null}

          <button className="primary-button" type="submit">
            {state.status === "loading" ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="lookup-banner">
          Local default: <strong>admin@travel-ops.local</strong> / <strong>admin123</strong>
        </div>
      </section>
    </main>
  );
}
