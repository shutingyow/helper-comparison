"use client";

import { AuthReady } from "@/components/AuthReady";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import {
  Inbox,
  CalendarDays,
  MessageCircle,
  Settings,
  KeyRound,
  Home,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/outreach", label: "Outreach", icon: MessageCircle },
  { href: "/preferences", label: "Preferences", icon: Settings },
  { href: "/settings", label: "HelperPlace", icon: KeyRound },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-stone-200/80 bg-white md:flex md:flex-col">
      <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-jade-100 text-jade-700">
          <Home className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-900">Helper Hub</p>
          <p className="text-xs text-stone-500">Application manager</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/inbox" && pathname === "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-jade-50 text-jade-800"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-stone-100 p-3">
        <SignOutButton>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-stone-200/80 bg-white px-4 py-3 md:hidden">
        <div>
          <p className="text-sm font-semibold text-stone-900">Helper Hub</p>
          <p className="text-xs text-stone-500">Application manager</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-stone-600 hover:bg-stone-100"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {open && (
        <nav className="border-b border-stone-200 bg-white px-3 py-2 md:hidden">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href === "/inbox" && pathname === "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  active
                    ? "bg-jade-50 text-jade-800"
                    : "text-stone-600 hover:bg-stone-50",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
          <div className="mt-1 border-t border-stone-100 pt-1">
            <SignOutButton>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </SignOutButton>
          </div>
        </nav>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-stone-200 bg-white md:hidden">
        {navItems.slice(0, 4).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/inbox" && pathname === "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                active ? "text-jade-700" : "text-stone-500",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/complete") ||
    pathname.startsWith("/guide");

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <AuthReady>
      <div className="flex min-h-screen bg-warm-50">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col pb-16 md:pb-0">
          <MobileNav />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </AuthReady>
  );
}
