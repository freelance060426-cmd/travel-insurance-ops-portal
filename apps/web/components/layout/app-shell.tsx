"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FileCheck2, FilePlus2, LayoutGrid, Receipt, Search, Users2 } from "lucide-react";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/partners", label: "Partners", icon: Users2 },
  { href: "/policies", label: "Policy Search", icon: Search },
  { href: "/policies/new", label: "Create Policy", icon: FilePlus2 },
  { href: "/invoices", label: "Invoices", icon: Receipt },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <div className="portal-brand__badge">TI</div>
          <div>
            <p className="portal-eyebrow">INTERNAL OPS</p>
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
          <strong>Manual-first</strong>
          <p>
            Bajaj integration stays open, but the product flow is already shaped for future API
            plug-in.
          </p>
        </div>
      </aside>

      <div className="portal-main">
        <header className="portal-topbar">
          <div>
            <p className="portal-eyebrow">TEAM VIEW</p>
            <h2>Operations workspace</h2>
          </div>

          <div className="portal-topbar__status">
            <div className="portal-chip">
              <FileCheck2 size={15} />
              <span>Policy PDFs enabled</span>
            </div>
            <div className="portal-avatar">SA</div>
          </div>
        </header>

        <main className="portal-content">{children}</main>
      </div>
    </div>
  );
}
