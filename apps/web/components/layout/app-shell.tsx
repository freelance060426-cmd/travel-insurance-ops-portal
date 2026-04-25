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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

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
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
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
          <div>
            <p className="portal-eyebrow">TEAM VIEW</p>
            <h2>Cover Edge operations workspace</h2>
          </div>

          <div className="portal-topbar__status">
            <div className="portal-chip">
              <FileCheck2 size={15} />
              <span>Policy PDFs enabled</span>
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
