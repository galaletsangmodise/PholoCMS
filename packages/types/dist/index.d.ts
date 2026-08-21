export type Role = "reception" | "clinical" | "manager";
export interface Patient {
    id: string;
    hprn: string | null;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: string;
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
    createdAt: string;
}
export type TicketStatus = "waiting" | "called" | "in_consult" | "completed" | "no_show";
export interface QueueTicket {
    id: string;
    patientId: string;
    facilityId: string;
    servicePoint: string;
    status: TicketStatus;
    source: "mobile" | "ussd" | "walk_in" | "appointment";
    queuePosition: number;
    checkedInAt: string;
    calledAt: string | null;
    completedAt: string | null;
}
export interface Encounter {
    id: string;
    patientId: string;
    ticketId: string;
    clinicianId: string;
    notes: string;
    diagnosisCodes: string[];
    completedAt: string | null;
}
export interface AuditLogEntry {
    id: string;
    actorId: string;
    actorRole: Role;
    action: "read" | "create" | "update";
    resourceType: "patient" | "encounter" | "ticket";
    resourceId: string;
    timestamp: string;
}
export interface CheckInRequest {
    patientId?: string;
    newPatient?: Pick<Patient, "firstName" | "lastName" | "phoneNumber" | "dateOfBirth">;
    facilityId: string;
    servicePoint: string;
    source: QueueTicket["source"];
}
export interface QueueSnapshot {
    facilityId: string;
    servicePoint: string;
    tickets: QueueTicket[];
}
