"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/inbox", label: "Inbox" },
  { href: "/today", label: "Today" },
  { href: "/outreach", label: "Outreach" },
  { href: "/preferences", label: "Preferences" },
];

export function Nav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-jade-700">
            Helper Hub
          </p>
          <h1 className="text-lg font-semibold text-stone-900">
            Application manager
          </h1>
        </div>
        <nav className="flex flex-wrap gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? "bg-jade-50 text-jade-800"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
