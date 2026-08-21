"use client"; 

import { useEffect, useState, useCallback } from "react"; // React hooks for state, side effects, and memoized functions
import { api } from "../../lib/api"; 
import type { Patient, QueueTicket } from "@pholo/types"; 

// Hardcoded for the first slice, becomes facility/service-point selectors
// once there's more than one clinic in the system.
const FACILITY_ID = "clinic-001";
const SERVICE_POINT = "General OPD";

export default function ReceptionPage() {
  const [query, setQuery] = useState(""); // what's currently typed in the search box
  const [results, setResults] = useState<Patient[]>([]); // search results returned from the API
  const [queue, setQueue] = useState<QueueTicket[]>([]); // the live list of people waiting
  const [checkingInId, setCheckingInId] = useState<string | null>(null); // tracks which patient's "Check in" button is mid-click, so we can disable it
  const [newPatientMode, setNewPatientMode] = useState(false); // whether the "register new patient" form is showing
  const [newPatient, setNewPatient] = useState({ firstName: "", lastName: "", phoneNumber: "", dateOfBirth: "" }); // form fields for a brand-new patient

  // useCallback so this function has a stable identity across re-renders 
  // needed because it's used inside useEffect's dependency array below.
  const refreshQueue = useCallback(async () => {
    const snap = await api.queueSnapshot(FACILITY_ID, SERVICE_POINT); // ask the API for the current state of this queue
    setQueue(snap.tickets.filter((t) => t.status === "waiting")); // only show people still waiting, not already called
  }, []);

  
  useEffect(() => {
    refreshQueue(); // run once immediately on page load
    const id = setInterval(refreshQueue, 4000); // then every 4 seconds after that
    return () => clearInterval(id); // cleanup: stop polling if the component unmounts (e.g. navigating away)
  }, [refreshQueue]);

  // Live search as you type, with a small debounce so we're not hitting the
  // API on every single keystroke.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]); // don't search until there's at least 2 characters
      return;
    }
    const id = setTimeout(async () => {
      setResults(await api.searchPatients(query)); // wait 250ms after the last keystroke, then actually search
    }, 250);
    return () => clearTimeout(id); // if the user keeps typing, cancel the pending search and start a new timer
  }, [query]);

  async function checkInExisting(patientId: string) {
    setCheckingInId(patientId); // disables this patient's button and shows "Checking in…"
    try {
      await api.checkIn({ patientId, facilityId: FACILITY_ID, servicePoint: SERVICE_POINT, source: "walk_in" });
      setQuery(""); // clear the search box
      setResults([]); // clear the search results
      await refreshQueue(); // immediately pull the updated queue so the new ticket shows without waiting for the next poll
    } finally {
      setCheckingInId(null); // re-enable buttons whether it succeeded or failed
    }
  }

  async function submitNewPatient(e: React.FormEvent) {
    e.preventDefault(); // stop the browser's default full-page form submission
    await api.checkIn({
      newPatient, // no patientId tells the API "create this person, then check them in"
      facilityId: FACILITY_ID,
      servicePoint: SERVICE_POINT,
      source: "walk_in",
    });
    setNewPatient({ firstName: "", lastName: "", phoneNumber: "", dateOfBirth: "" }); // reset the form
    setNewPatientMode(false); // hide the form again
    await refreshQueue(); // show the new ticket immediately
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Reception — {SERVICE_POINT}</h1>
        <p className="text-sm text-slate-500">{FACILITY_ID}</p>
      </header>

      {/* Two-column layout: search/check-in on the left, live queue on the right */}
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <label className="block text-sm font-medium text-slate-700" htmlFor="search">
            Search by name, phone, or HPRN
          </label>
          <input
            id="search"
            autoFocus // cursor starts here when the page loads 
            value={query}
            onChange={(e) => setQuery(e.target.value)} // every keystroke updates `query`, which triggers the search useEffect above
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
                    disabled={checkingInId === p.id} // only disables THIS button while THIS patient is checking in
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {checkingInId === p.id ? "Checking in…" : "Check in"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Shown when the user typed something but no matches came back */}
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
                {/* Each input is "controlled" its value always comes from state, and typing updates that state */}
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

        {/* Live queue panel */}
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