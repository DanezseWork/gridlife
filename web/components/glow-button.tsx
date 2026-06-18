import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlowButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode;
}

export function GlowButton({ children, className, variant, ...props }: GlowButtonProps) {
  return (
    <Button
      variant={variant ?? "outline"}
      className={cn(
        "glow-focus min-h-11 border-[var(--color-accent)] bg-transparent text-[var(--color-accent)] hover:bg-[var(--color-accent-surface)]",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
