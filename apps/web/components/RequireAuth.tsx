"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login"); // not logged in, and we're done checking, send them to login
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Checking session…
      </div>
    );
  }

  if (!session) {
    return null; // about to redirect, render nothing in the meantime
  }

  return <>{children}</>;
}