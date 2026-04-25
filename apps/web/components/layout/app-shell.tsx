"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  BarChart3,
  FileCheck2,
  FilePlus2,
  LayoutGrid,
  Receipt,
  Search,
  ShieldCheck,
  Users2,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/partners", label: "Partners", icon: Users2 },
  { href: "/policies", label: "Policy Search", icon: Search },
  { href: "/policies/new", label: "Create Policy", icon: FilePlus2 },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

type ModuleContext = {
  eyebrow: string;
  title: string;
  description: string;
};

const moduleCopy: Record<string, ModuleContext> = {
  "/dashboard": {
    eyebrow: "COMMAND CENTER",
    title: "Daily operations control room",
    description: "Track policies, invoices, PDFs, and client dispatch from one workspace.",
  },
  "/partners": {
    eyebrow: "NETWORK",
    title: "Partner operations",
    description: "Manage partner records and keep policy ownership clear.",
  },
  "/policies": {
    eyebrow: "POLICY DESK",
    title: "Policy search and servicing",
    description: "Find policies, inspect history, and continue service actions.",
  },
  "/policies/new": {
    eyebrow: "NEW POLICY",
    title: "Create travel policy",
    description: "Capture policy, traveller, and plan details through a guided flow.",
  },
  "/invoices": {
    eyebrow: "BILLING DESK",
    title: "Invoice generation and dispatch",
    description: "Generate, download, and send invoices from eligible policy records.",
  },
  "/reports": {
    eyebrow: "REPORTING",
    title: "Operational reports",
    description: "Review policy activity and export CSV reports for follow-up.",
  },
};

function isActiveRoute(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  if (href === "/policies") {
    return (
      pathname === "/policies" ||
      (pathname.startsWith("/policies/") && pathname !== "/policies/new")
    );
  }

  if (href === "/policies/new") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getModuleCopy(pathname: string): ModuleContext {
  if (pathname === "/policies/new") {
    return moduleCopy["/policies/new"]!;
  }

  const match = navigation.find((item) => isActiveRoute(pathname, item.href));
  return moduleCopy[match?.href ?? "/dashboard"] ?? moduleCopy["/dashboard"]!;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const currentModule = getModuleCopy(pathname);

  function handleLogout() {
    signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <Image
            src="/brand/cover-edge-logo.png"
            alt="Cover Edge Assist"
            width={58}
            height={58}
            className="portal-brand__logo"
          />
          <div>
            <p className="portal-eyebrow">COVER EDGE OPS</p>
            <h1>Travel Insurance Portal</h1>
          </div>
        </div>

        <nav className="portal-nav">
          {navigation.map((item) => {
            const isActive = isActiveRoute(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`portal-nav__link ${isActive ? "is-active" : ""}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="portal-sidebar__card">
          <p className="portal-eyebrow">PHASE 1</p>
          <strong>Manual-first, client-ready</strong>
          <p>
            Brand-aligned operations with invoice generation, PDF delivery, and
            insurer-ready workflow boundaries.
          </p>
        </div>
      </aside>

      <div className="portal-main">
        <header className="portal-topbar">
          <div className="portal-topbar__copy">
            <p className="portal-eyebrow">{currentModule.eyebrow}</p>
            <h2>{currentModule.title}</h2>
            <p>{currentModule.description}</p>
          </div>

          <div className="portal-topbar__status">
            <div className="portal-chip">
              <ShieldCheck size={15} />
              <span>Protected session</span>
            </div>
            <div className="portal-chip portal-chip--strong">
              <FileCheck2 size={15} />
              <span>PDF + email ready</span>
            </div>
            <div className="portal-user-meta">
              <div className="portal-user-meta__text">
                <strong>{user?.name ?? "User"}</strong>
                <span>{user?.role ?? "Unknown role"}</span>
              </div>
              <div className="portal-avatar">
                {(user?.name ?? "U").slice(0, 2).toUpperCase()}
              </div>
              <button className="ghost-button" type="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="portal-content">{children}</main>
      </div>
    </div>
  );
}
