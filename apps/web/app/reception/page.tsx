"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth-context";
import { RequireAuth } from "../../components/RequireAuth";
import { useRouter } from "next/navigation";
import type { Patient, QueueTicket } from "@pholo/types";

const FACILITY_ID = "clinic-001";
const SERVICE_POINT = "General OPD";

function ReceptionContent() {
  const { profile } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [newPatientMode, setNewPatientMode] = useState(false);
  const [newPatient, setNewPatient] = useState({ firstName: "", lastName: "", phoneNumber: "", dateOfBirth: "" });

  const refreshQueue = useCallback(async () => {
    const snap = await api.queueSnapshot(FACILITY_ID, SERVICE_POINT);
    setQueue(snap.tickets.filter((t) => t.status === "waiting"));
  }, []);

  useEffect(() => {
    refreshQueue();
    const id = setInterval(refreshQueue, 4000);
    return () => clearInterval(id);
  }, [refreshQueue]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      setResults(await api.searchPatients(query));
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  async function checkInExisting(patientId: string) {
    setCheckingInId(patientId);
    try {
      await api.checkIn({ patientId, facilityId: FACILITY_ID, servicePoint: SERVICE_POINT, source: "walk_in" });
      setQuery("");
      setResults([]);
      await refreshQueue();
    } finally {
      setCheckingInId(null);
    }
  }

  async function submitNewPatient(e: React.FormEvent) {
    e.preventDefault();
    await api.checkIn({
      newPatient,
      facilityId: FACILITY_ID,
      servicePoint: SERVICE_POINT,
      source: "walk_in",
    });
    setNewPatient({ firstName: "", lastName: "", phoneNumber: "", dateOfBirth: "" });
    setNewPatientMode(false);
    await refreshQueue();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Reception — {SERVICE_POINT}</h1>
          <p className="text-sm text-slate-500">{FACILITY_ID}</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {profile && <span className="text-slate-500">{profile.fullName}</span>}
          <button onClick={handleLogout} className="rounded-md px-3 py-1.5 text-slate-500 hover:bg-slate-100">
            Sign out
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <label className="block text-sm font-medium text-slate-700" htmlFor="search">
            Search by name, phone, or HPRN
          </label>
          <input
            id="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type at least 2 characters…"
            className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />

          {results.length > 0 && (
            <ul className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
              {results.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-3 py-2.5">
                  <div>
                    <p className="font-medium">{p.firstName} {p.lastName}</p>
                    <p className="text-sm text-slate-500">{p.phoneNumber}{p.hprn ? ` · HPRN ${p.hprn}` : ""}</p>
                  </div>
                  <button
                    onClick={() => checkInExisting(p.id)}
                    disabled={checkingInId === p.id}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {checkingInId === p.id ? "Checking in…" : "Check in"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim().length >= 2 && results.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">
              No match.{" "}
              <button className="font-medium text-blue-600 hover:underline" onClick={() => setNewPatientMode(true)}>
                Register as a new patient
              </button>
            </p>
          )}

          {newPatientMode && (
            <form onSubmit={submitNewPatient} className="mt-4 space-y-3 border-t border-slate-200 pt-4">
              <p className="text-sm font-medium text-slate-700">New patient intake</p>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="First name" value={newPatient.firstName}
                  onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input required placeholder="Last name" value={newPatient.lastName}
                  onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input required placeholder="Phone number" value={newPatient.phoneNumber}
                  onChange={(e) => setNewPatient({ ...newPatient, phoneNumber: e.target.value })}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input required type="date" value={newPatient.dateOfBirth}
                  onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Register &amp; check in
                </button>
                <button type="button" onClick={() => setNewPatientMode(false)} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:bg-slate-100">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">Waiting — live</h2>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {queue.length} in queue
            </span>
          </div>
          {queue.length === 0 ? (
            <p className="text-sm text-slate-400">No one waiting right now.</p>
          ) : (
            <ol className="space-y-1.5">
              {queue.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                  <span className="tabular-nums font-medium">#{t.queuePosition}</span>
                  <span className="text-slate-400">{t.source}</span>
                  <span className="text-slate-500">
                    {new Date(t.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}

// The page itself just wraps the real content in RequireAuth — keeps the
// auth-checking concern separate from reception's own logic.
export default function ReceptionPage() {
  return (
    <RequireAuth>
      <ReceptionContent />
    </RequireAuth>
  );
}