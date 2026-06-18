import { cn } from "@/lib/utils";

export function GridlifeLogo({ className }: { className?: string }) {
  return (
    <h1
      className={cn(
        "glitch-logo text-3xl font-bold tracking-widest uppercase",
        className,
      )}
      style={{ color: "var(--color-accent)" }}
    >
      Gridlife
    </h1>
  );
}
