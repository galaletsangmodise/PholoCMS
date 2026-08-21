"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let QueueService = class QueueService {
    constructor() {
        this.tickets = new Map(); // in-memory store: ticket ID -> ticket object. Wiped on restart.
    }
    checkIn(input) {
        // Find everyone currently waiting at this exact facility + service point,
        // so we know what position number to assign the new ticket.
        const currentWaiting = this.forServicePoint(input.facilityId, input.servicePoint).filter((t) => t.status === "waiting");
        const ticket = {
            id: (0, crypto_1.randomUUID)(), // unique ID for this ticket
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
    forServicePoint(facilityId, servicePoint) {
        return [...this.tickets.values()] // turn the Map's values into a plain array
            .filter((t) => t.facilityId === facilityId && t.servicePoint === servicePoint) // only this clinic + service point
            .sort((a, b) => a.checkedInAt.localeCompare(b.checkedInAt)); // oldest check-in first
    }
    snapshot(facilityId, servicePoint) {
        return {
            facilityId,
            servicePoint,
            tickets: this.forServicePoint(facilityId, servicePoint), // the current state of this queue, ready to send to the frontend
        };
    }
    callNext(facilityId, servicePoint) {
        // Find the first ticket still "waiting" in line
        const next = this.forServicePoint(facilityId, servicePoint).find((t) => t.status === "waiting");
        if (!next)
            return null; // nobody waiting — nothing to call
        next.status = "called"; // flip their status
        next.calledAt = new Date().toISOString(); // record when they were called
        this.tickets.set(next.id, next); // save the updated ticket back into the map
        return next;
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, common_1.Injectable)()
], QueueService);
