"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, ListChecks, Settings, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md md:hidden"
      style={{
        borderColor: "var(--color-border)",
        background: "color-mix(in srgb, var(--color-base) 85%, transparent)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2 sm:max-w-2xl">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 min-w-16 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-3 py-1 text-xs transition-colors sm:text-sm",
                active && "chip-active",
              )}
              style={{
                color: active ? "var(--color-accent)" : "var(--color-inverse)",
              }}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
