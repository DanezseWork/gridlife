import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-lg px-4 py-6 sm:px-6 sm:py-8 md:max-w-2xl lg:max-w-4xl lg:px-8 xl:max-w-5xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
