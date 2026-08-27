import { Injectable, NotFoundException, InternalServerErrorException } from "@nestjs/common";
import { supabase } from "../../lib/supabase";
import { AuditService } from "../audit/audit.service"; 
import type { Patient } from "@pholo/types";

function toPatient(row: any): Patient {
  return {
    id: row.id,
    hprn: row.hprn,
    firstName: row.first_name,
    lastName: row.last_name,
    phoneNumber: row.phone_number,
    dateOfBirth: row.date_of_birth,
    allergies: row.allergies,
    chronicConditions: row.chronic_conditions,
    currentMedications: row.current_medications,
    createdAt: row.created_at,
  };
}

// TEMPORARY: stands in for a real logged-in user until Supabase Auth exists.

const PLACEHOLDER_ACTOR = { actorId: "00000000-0000-0000-0000-000000000000", actorRole: "reception" as const };

@Injectable()
export class PatientsService {
  constructor(private readonly audit: AuditService) {} // Nest injects the AuditService we wired up last batch

  async findById(id: string): Promise<Patient> {
    const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();
    if (error || !data) throw new NotFoundException(`Patient ${id} not found`);
    return toPatient(data);
  }

  async findByPhone(phoneNumber: string): Promise<Patient | undefined> {
    const { data, error } = await supabase.from("patients").select("*").eq("phone_number", phoneNumber).maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    return data ? toPatient(data) : undefined;
  }

  async search(query: string): Promise<Patient[]> {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone_number.ilike.%${query}%,hprn.eq.${query}`);
    if (error) throw new InternalServerErrorException(error.message);
    return (data ?? []).map(toPatient);
  }

  async create(input: Pick<Patient, "firstName" | "lastName" | "phoneNumber" | "dateOfBirth">): Promise<Patient> {
    const { data, error } = await supabase
      .from("patients")
      .insert({
        first_name: input.firstName,
        last_name: input.lastName,
        phone_number: input.phoneNumber,
        date_of_birth: input.dateOfBirth,
      })
      .select()
      .single();
    if (error || !data) throw new InternalServerErrorException(error?.message ?? "Failed to create patient");

    const patient = toPatient(data);

  
    await this.audit.log({
      ...PLACEHOLDER_ACTOR,
      action: "create",
      resourceType: "patient",
      resourceId: patient.id,
    });

    return patient;
  }
}