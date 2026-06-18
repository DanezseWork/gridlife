import { cn } from "@/lib/utils";

export function ScanlineSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn("skeleton-scanline rounded-md", className)}
      aria-hidden
    />
  );
}
