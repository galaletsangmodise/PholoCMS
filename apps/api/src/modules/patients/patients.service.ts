import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { Patient } from "@pholo/types";

@Injectable()
export class PatientsService {
  private patients = new Map<string, Patient>();

  findById(id: string): Patient {
    const patient = this.patients.get(id);
    if (!patient) throw new NotFoundException(`Patient ${id} not found`);
    return patient;
  }

  findByPhone(phoneNumber: string): Patient | undefined {
    return [...this.patients.values()].find((p) => p.phoneNumber === phoneNumber);
  }

  search(query: string): Patient[] {
    const q = query.toLowerCase();
    return [...this.patients.values()].filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.phoneNumber.includes(q) ||
        p.hprn?.toLowerCase() === q,
    );
  }

  create(input: Pick<Patient, "firstName" | "lastName" | "phoneNumber" | "dateOfBirth">): Patient {
    const patient: Patient = {
      id: randomUUID(),
      hprn: null,
      allergies: [],
      chronicConditions: [],
      currentMedications: [],
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.patients.set(patient.id, patient);
    return patient;
  }
}