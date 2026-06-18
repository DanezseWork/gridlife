"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { GlowButton } from "@/components/glow-button";
import { HoloCard } from "@/components/holo-card";
import { PageContainer } from "@/components/page-container";
import { ThemePicker } from "@/components/theme-picker";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { useThemeStore } from "@/store/theme";

export default function SettingsPage() {
  const router = useRouter();
  const { applyTheme } = useThemeStore();
  const [saving, setSaving] = useState(false);

  async function handleThemeChange(baseColor: string, accentColor: string) {
    setSaving(true);
    try {
      await api.updateSettings({ baseColor, accentColor });
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  useEffect(() => {
    api.getMe().then((me) => {
      if (me.settings) {
        applyTheme(me.settings.baseColor, me.settings.accentColor);
      }
    });
  }, [applyTheme]);

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <header className="mb-6 sm:mb-8">
          <h1
            className="text-2xl font-bold tracking-wide sm:text-3xl"
            style={{ color: "var(--color-accent)" }}
          >
            Settings
          </h1>
        </header>

        <div className="space-y-4 lg:max-w-2xl">
          <ThemePicker onChange={handleThemeChange} />

          <HoloCard>
            <GlowButton
              onClick={handleLogout}
              className="w-full min-h-11 gap-2 sm:min-h-12"
              variant="outline"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </GlowButton>
          </HoloCard>

          {saving && (
            <p className="text-center text-xs opacity-50 sm:text-sm">Saving…</p>
          )}
        </div>
      </motion.div>
    </PageContainer>
  );
}
