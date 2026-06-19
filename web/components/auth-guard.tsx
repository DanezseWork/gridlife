"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      setAllowed(false);
      router.replace("/login");
    }
  }, [router]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
