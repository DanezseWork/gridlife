import { cn } from "@/lib/utils";

interface HoloCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function HoloCard({ children, className, ...props }: HoloCardProps) {
  return (
    <div className={cn("holo-card rounded-lg p-4", className)} {...props}>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
