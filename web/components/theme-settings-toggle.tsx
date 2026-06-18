"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Palette, X } from "lucide-react";
import { HoloCard } from "@/components/holo-card";
import { ThemePicker } from "@/components/theme-picker";
import { cn } from "@/lib/utils";

interface ThemeSettingsToggleProps {
  onChange?: (baseColor: string, accentColor: string) => void;
}

export function ThemeSettingsToggle({ onChange }: ThemeSettingsToggleProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close theme settings"
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        className="fixed z-50 flex flex-col items-end gap-3"
        style={{
          bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
          right: "calc(1rem + env(safe-area-inset-right, 0px))",
        }}
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="w-[min(100vw-2rem,20rem)] sm:w-80 lg:w-96"
            >
              <HoloCard className="hud-border shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--color-inverse)" }}
                  >
                    Preview theme
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md p-1 opacity-60 transition-opacity hover:opacity-100"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ThemePicker compact onChange={onChange} />
              </HoloCard>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Hide theme settings" : "Show theme settings"}
          aria-expanded={open}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border transition-all sm:h-14 sm:w-14",
            open && "chip-active",
          )}
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-accent)",
            color: "var(--color-accent)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Palette className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}
