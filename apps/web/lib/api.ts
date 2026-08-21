import type { Patient, QueueSnapshot, QueueTicket, CheckInRequest } from "@pholo/types"; 

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"; 


async function json<T>(resPromise: Promise<Response>): Promise<T> {
  const res = await resPromise; // wait for the network call to resolve
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`); // non-2xx status — surface the error
  return res.json(); // parse and return the body as type T
}

export const api = {
  // GET /patients/search?q=... used by the reception search box
  searchPatients: (q: string) =>
    json<Patient[]>(fetch(`${API_BASE}/patients/search?q=${encodeURIComponent(q)}`)),

  // POST /queue/check-in..checks an existing or brand-new patient into the queue
  checkIn: (body: CheckInRequest) =>
    json<QueueTicket>(
      fetch(`${API_BASE}/queue/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(body), 
      }),
    ),

  // GET /queue/snapshot, the current state of one clinic's queue, polled repeatedly by the UI
  queueSnapshot: (facilityId: string, servicePoint: string) =>
    json<QueueSnapshot>(
      fetch(
        `${API_BASE}/queue/snapshot?facilityId=${encodeURIComponent(facilityId)}&servicePoint=${encodeURIComponent(servicePoint)}`,
      ),
    ),
};