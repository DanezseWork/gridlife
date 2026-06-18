"use client";

import { cn } from "@/lib/utils";

interface FabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  label: string;
  wrapperClassName?: string;
}

export function Fab({ children, label, className, wrapperClassName, ...props }: FabProps) {
  return (
    <div className={cn("fab-anchor pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-40 mx-auto w-full max-w-lg px-4 sm:px-6 md:bottom-8 md:max-w-2xl lg:max-w-4xl lg:px-8 xl:max-w-5xl", wrapperClassName)}>
      <div className="flex justify-end">
        <button
          type="button"
          className={cn(
            "btn-accent glow-focus pointer-events-auto flex h-14 items-center justify-center gap-2 rounded-full px-5 shadow-lg transition-transform active:scale-95 sm:h-16 sm:px-6",
            className,
          )}
          aria-label={label}
          {...props}
        >
          {children}
        </button>
      </div>
    </div>
  );
}
