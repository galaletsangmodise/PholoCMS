"use client"; 

import { useState } from "react";
import { api } from "../../lib/api";
import type { Patient, QueueTicket, Encounter } from "@pholo/types";


const FACILITY_ID = "clinic-001";
const SERVICE_POINT = "General OPD";

export default function ClinicalPage() {
  const [ticket, setTicket] = useState<QueueTicket | null>(null); // the currently-called patient's ticket
  const [patient, setPatient] = useState<Patient | null>(null); // that patient's full record
  const [encounter, setEncounter] = useState<Encounter | null>(null); // the open encounter for this visit
  const [notes, setNotes] = useState(""); // clinician's free-text notes for this visit
  const [diagnosisInput, setDiagnosisInput] = useState(""); // comma-separated ICD-10 codes, typed as plain text for now
  const [showFullHistory, setShowFullHistory] = useState(false); // toggles the collapsible full record 
  const [loading, setLoading] = useState(false); // disables buttons mid-request so you can't double-click

  async function handleCallNext() {
    setLoading(true);
    try {
      const nextTicket = await api.callNext(FACILITY_ID, SERVICE_POINT); // ask the API for the next waiting patient
      if (!nextTicket) {
        alert("No one waiting."); 
        return;
      }
      setTicket(nextTicket);

      const [fetchedPatient, newEncounter] = await Promise.all([
        api.getPatient(nextTicket.patientId), // load their record
        api.startEncounter(nextTicket.patientId, nextTicket.id), // and open an encounter — both audited on the backend
      ]);
      setPatient(fetchedPatient);
      setEncounter(newEncounter);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteVisit() {
    if (!encounter || !ticket) return; // shouldn't happen — button is only shown when both exist
    setLoading(true);
    try {
      const diagnosisCodes = diagnosisInput
        .split(",") // split on commas
        .map((code) => code.trim()) // trim whitespace around each code
        .filter(Boolean); // drop empty entries 

      await api.completeEncounter(encounter.id, notes, diagnosisCodes); // save notes + codes, marks encounter done
      await api.completeTicket(ticket.id); // marks the queue ticket done too

      // reset everything so "Call next" is ready to go again
      setTicket(null);
      setPatient(null);
      setEncounter(null);
      setNotes("");
      setDiagnosisInput("");
      setShowFullHistory(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Clinical — {SERVICE_POINT}</h1>
        <p className="text-sm text-slate-500">{FACILITY_ID}</p>
      </header>

      <div className="mx-auto max-w-2xl p-6">
        {!patient ? (
          // No one currently in the room — just show the call-next button
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <p className="mb-4 text-sm text-slate-500">No patient in room.</p>
            <button
              onClick={handleCallNext}
              disabled={loading}
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Calling…" : "Call next patient"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 4-field minimum — front and center */}
            <section className="rounded-lg border-2 border-blue-200 bg-white p-5">
              <h2 className="text-lg font-semibold">{patient.firstName} {patient.lastName}</h2>
              <p className="mb-4 text-sm text-slate-500">
                {patient.phoneNumber}{patient.hprn ? ` · HPRN ${patient.hprn}` : ""}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-slate-700">Allergies</p>
                  <p className="text-slate-600">
                    {patient.allergies.length > 0 ? patient.allergies.join(", ") : "None recorded"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Chronic conditions</p>
                  <p className="text-slate-600">
                    {patient.chronicConditions.length > 0 ? patient.chronicConditions.join(", ") : "None recorded"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Current medications</p>
                  <p className="text-slate-600">
                    {patient.currentMedications.length > 0 ? patient.currentMedications.join(", ") : "None recorded"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Last visit</p>
                  {/* Gap, flagged deliberately */}
                  <p className="text-slate-400 italic">
                    Not available yet — patient on file since{" "}
                    {new Date(patient.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowFullHistory(!showFullHistory)}
                className="mt-4 text-sm font-medium text-blue-600 hover:underline"
              >
                {showFullHistory ? "Hide full history" : "Show full history"}
              </button>

              {showFullHistory && (
                <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
                  {/* Placeholder — full encounter history isn't fetched yet either, same gap as "last visit" above */}
                  Full encounter history isn't wired up yet — this is where past visits will list once that endpoint exists.
                </div>
              )}
            </section>

            {/* Visit notes + completion */}
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <label className="block text-sm font-medium text-slate-700" htmlFor="notes">
                Visit notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="What happened during this visit…"
              />

              <label className="mt-3 block text-sm font-medium text-slate-700" htmlFor="codes">
                Diagnosis codes (ICD-10, comma-separated)
              </label>
              <input
                id="codes"
                value={diagnosisInput}
                onChange={(e) => setDiagnosisInput(e.target.value)}
                placeholder="e.g. J06.9, I10"
                className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
             

              <button
                onClick={handleCompleteVisit}
                disabled={loading}
                className="mt-4 rounded-md bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Saving…" : "Complete visit"}
              </button>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}