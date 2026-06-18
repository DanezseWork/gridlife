"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, ListChecks, Settings, Wallet } from "lucide-react";
import { GridlifeLogo } from "@/components/gridlife-logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside
      className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r px-4 py-6 md:flex lg:w-64"
      style={{
        borderColor: "var(--color-border)",
        background: "color-mix(in srgb, var(--color-base) 92%, transparent)",
      }}
    >
      <div className="mb-8 px-2">
        <GridlifeLogo className="text-xl lg:text-2xl" />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active && "chip-active",
              )}
              style={{
                color: active ? "var(--color-accent)" : "var(--color-inverse)",
              }}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
