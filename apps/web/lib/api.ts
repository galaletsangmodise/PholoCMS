import type { Patient, QueueSnapshot, QueueTicket, CheckInRequest, Encounter } from "@pholo/types"; // added Encounter

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function json<T>(resPromise: Promise<Response>): Promise<T> {
  const res = await resPromise;
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  searchPatients: (q: string) =>
    json<Patient[]>(fetch(`${API_BASE}/patients/search?q=${encodeURIComponent(q)}`)),

  // Fetch one patient's full record, for the clinical screen
  getPatient: (id: string) => json<Patient>(fetch(`${API_BASE}/patients/${id}`)),

  checkIn: (body: CheckInRequest) =>
    json<QueueTicket>(
      fetch(`${API_BASE}/queue/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    ),

  queueSnapshot: (facilityId: string, servicePoint: string) =>
    json<QueueSnapshot>(
      fetch(
        `${API_BASE}/queue/snapshot?facilityId=${encodeURIComponent(facilityId)}&servicePoint=${encodeURIComponent(servicePoint)}`,
      ),
    ),

  // Clinical staff pulls the next waiting patient
  callNext: (facilityId: string, servicePoint: string) =>
    json<QueueTicket | null>(
      fetch(`${API_BASE}/queue/call-next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId, servicePoint }),
      }),
    ),

  // NEW — marks a ticket done once the visit is complete
  completeTicket: (ticketId: string) =>
    json<QueueTicket>(fetch(`${API_BASE}/queue/${ticketId}/complete`, { method: "POST" })),

  // NEW — opens an encounter when the clinician pulls up the record
  startEncounter: (patientId: string, ticketId: string) =>
    json<Encounter>(
      fetch(`${API_BASE}/encounters/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, ticketId }),
      }),
    ),

  // Saves notes/codes and marks the encounter done
  completeEncounter: (encounterId: string, notes: string, diagnosisCodes: string[]) =>
    json<Encounter>(
      fetch(`${API_BASE}/encounters/${encounterId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, diagnosisCodes }),
      }),
    ),
};