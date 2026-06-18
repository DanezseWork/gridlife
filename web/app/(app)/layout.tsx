import { BottomNav } from "@/components/bottom-nav";
import { AuthGuard } from "@/components/auth-guard";
import { SideNav } from "@/components/side-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div
        className="min-h-screen md:flex"
        style={{ background: "var(--color-base)", color: "var(--color-inverse)" }}
      >
        <SideNav />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6">
          <main className="flex-1">{children}</main>
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
