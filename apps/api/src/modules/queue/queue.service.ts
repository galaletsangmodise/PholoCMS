import { Injectable } from "@nestjs/common"; 
import { randomUUID } from "crypto"; 
import type { QueueTicket, QueueSnapshot } from "@pholo/types"; 

@Injectable()
export class QueueService {
  private tickets = new Map<string, QueueTicket>(); // in-memory store: ticket ID -> ticket object. Wiped on restart.

  checkIn(input: {
    patientId: string;
    facilityId: string;
    servicePoint: string;
    source: QueueTicket["source"]; 
  }): QueueTicket {
    // Find everyone currently waiting at this exact facility + service point,
    // so we know what position number to assign the new ticket.
    const currentWaiting = this.forServicePoint(input.facilityId, input.servicePoint).filter(
      (t) => t.status === "waiting",
    );

    const ticket: QueueTicket = {
      id: randomUUID(), // unique ID for this ticket
      patientId: input.patientId,
      facilityId: input.facilityId,
      servicePoint: input.servicePoint,
      status: "waiting", // every new ticket starts as "waiting"
      source: input.source, // where the check-in came from (mobile/ussd/walk_in/appointment)
      queuePosition: currentWaiting.length + 1, // simple position = how many are ahead, plus one
      checkedInAt: new Date().toISOString(), // timestamp, stored as ISO string
      calledAt: null, // not called yet
      completedAt: null, // not completed yet
    };
    this.tickets.set(ticket.id, ticket); // save it into the in-memory map
    return ticket; // hand it back to whoever called checkIn()
  }

  forServicePoint(facilityId: string, servicePoint: string): QueueTicket[] {
    return [...this.tickets.values()] // turn the Map's values into a plain array
      .filter((t) => t.facilityId === facilityId && t.servicePoint === servicePoint) // only this clinic + service point
      .sort((a, b) => a.checkedInAt.localeCompare(b.checkedInAt)); // oldest check-in first
  }

  snapshot(facilityId: string, servicePoint: string): QueueSnapshot {
    return {
      facilityId,
      servicePoint,
      tickets: this.forServicePoint(facilityId, servicePoint), // the current state of this queue, ready to send to the frontend
    };
  }

  callNext(facilityId: string, servicePoint: string): QueueTicket | null {
    // Find the first ticket still "waiting" in line
    const next = this.forServicePoint(facilityId, servicePoint).find((t) => t.status === "waiting");
    if (!next) return null; // nobody waiting — nothing to call
    next.status = "called"; // flip their status
    next.calledAt = new Date().toISOString(); // record when they were called
    this.tickets.set(next.id, next); // save the updated ticket back into the map
    return next;
  }
}