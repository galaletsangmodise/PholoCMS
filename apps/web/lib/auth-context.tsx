"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Role } from "@pholo/types";

interface StaffProfile {
  fullName: string;
  role: Role;
  facilityId: string;
}

interface AuthState {
  session: Session | null; // null = not logged in
  profile: StaffProfile | null; // their role info from staff_profiles
  loading: boolean; // true while we're still checking
}

const AuthContext = createContext<AuthState>({ session: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for an existing session on page load 
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false); // no session — nothing more to fetch
    });

    // Also listen for login/logout events happening while the page is open
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe(); // cleanup on unmount
  }, []);

  useEffect(() => {
    if (!session) return; // nothing to fetch without a logged-in user

    // Fetch this user's role from staff_profiles — RLS policy from the
    // migration ensures they can only ever see their own row.
    supabase
      .from("staff_profiles")
      .select("full_name, role, facility_id")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.error("Failed to load staff profile:", error?.message);
          setProfile(null);
        } else {
          setProfile({ fullName: data.full_name, role: data.role, facilityId: data.facility_id });
        }
        setLoading(false);
      });
  }, [session]);

  return <AuthContext.Provider value={{ session, profile, loading }}>{children}</AuthContext.Provider>;
}

// Convenience hook — components call useAuth() instead of useContext(AuthContext) directly
export function useAuth() {
  return useContext(AuthContext);
}