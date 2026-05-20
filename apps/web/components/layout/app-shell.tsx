"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  BarChart3,
  FilePlus2,
  LayoutGrid,
  Receipt,
  Search,
  Users2,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

const navigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
    roles: ["SUPER_ADMIN", "PARTNER"],
  },
  {
    href: "/partners",
    label: "Partners",
    icon: Users2,
    roles: ["SUPER_ADMIN"],
  },
  {
    href: "/policies",
    label: "Policy Search",
    icon: Search,
    roles: ["SUPER_ADMIN", "PARTNER"],
  },
  {
    href: "/policies/new",
    label: "Create Policy",
    icon: FilePlus2,
    roles: ["SUPER_ADMIN", "PARTNER"],
  },
  {
    href: "/invoices",
    label: "Invoices",
    icon: Receipt,
    roles: ["SUPER_ADMIN", "PARTNER"],
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["SUPER_ADMIN"],
  },
];

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
            <p className="portal-eyebrow">Cover Edge</p>
            <h1>Travel Insurance</h1>
          </div>
        </div>

        <nav className="portal-nav">
          {navigation
            .filter((item) => item.roles.includes(user?.role ?? "SUPER_ADMIN"))
            .map((item) => {
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

        <div className="portal-sidebar-footer">
          <div className="portal-sidebar-footer__avatar">
            {(user?.name ?? "U").slice(0, 2).toUpperCase()}
          </div>
          <div className="portal-sidebar-footer__text">
            <strong>{user?.name ?? "User"}</strong>
            <span>{user?.role ?? "Unknown role"}</span>
          </div>
          <button
            className="portal-sidebar-footer__logout"
            type="button"
            onClick={handleLogout}
            title="Logout"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </aside>

      <div className="portal-main">
        <main className="portal-content">{children}</main>
      </div>
    </div>
  );
}
