"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GridlifeLogo } from "@/components/gridlife-logo";
import { GlowButton } from "@/components/glow-button";
import { HoloCard } from "@/components/holo-card";
import { ThemeSettingsToggle } from "@/components/theme-settings-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useThemeStore } from "@/store/theme";

export default function LoginPage() {
  const router = useRouter();
  const { baseColor, accentColor } = useThemeStore();
  const [email, setEmail] = useState("demo@gridlife.app");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { token } = await api.login(email, password);
      setToken(token);

      await api.updateSettings({ baseColor, accentColor });

      router.replace("/habits");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
      style={{
        background: "var(--color-base)",
        paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="scanline-overlay absolute inset-0" />

      <div className="relative z-10 grid w-full max-w-sm gap-6 sm:max-w-md lg:max-w-4xl lg:grid-cols-2 lg:items-center lg:gap-12 xl:max-w-5xl">
        <div className="space-y-4 text-center lg:text-left">
          <GridlifeLogo className="text-3xl sm:text-4xl lg:text-5xl" />
          <p
            className="text-sm opacity-60 sm:text-base"
            style={{ color: "var(--color-inverse)" }}
          >
            Habits, tasks, and personal finance — one dashboard.
          </p>
          <p
            className="hidden text-sm leading-relaxed opacity-50 lg:block"
            style={{ color: "var(--color-inverse)" }}
          >
            Build streaks, plan your day with tasks and subtasks, and track
            wallets, transactions, and upcoming bills — all in one clean,
            customizable dashboard.
          </p>
        </div>

        <div className="space-y-6">
          <HoloCard className="hud-border">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="min-h-11 bg-transparent sm:min-h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="min-h-11 bg-transparent sm:min-h-12"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500" role="alert">
                  {error}
                </p>
              )}

              <GlowButton
                type="submit"
                className="w-full min-h-11 sm:min-h-12"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in"}
              </GlowButton>
            </form>
          </HoloCard>

          <p
            className="text-center text-xs opacity-50 sm:text-sm"
            style={{ color: "var(--color-inverse)" }}
          >
            Demo: demo@gridlife.app / password123
          </p>
        </div>
      </div>

      <ThemeSettingsToggle />
    </div>
  );
}
