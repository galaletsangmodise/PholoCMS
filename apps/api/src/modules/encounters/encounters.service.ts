import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { supabase } from "../../lib/supabase";
import { AuditService } from "../audit/audit.service";
import type { Encounter } from "@pholo/types";

function toEncounter(row: any): Encounter {
  return {
    id: row.id,
    patientId: row.patient_id,
    ticketId: row.ticket_id,
    clinicianId: row.clinician_id,
    notes: row.notes ?? "",
    diagnosisCodes: row.diagnosis_codes,
    completedAt: row.completed_at,
  };
}

// Same placeholder pattern as patients/queue — swapped for a real user once auth lands.
const PLACEHOLDER_CLINICIAN_ID = "00000000-0000-0000-0000-000000000000";

@Injectable()
export class EncountersService {
  constructor(private readonly audit: AuditService) {}

  // Called once clinical staff pulls up a patient's record 
  // Creates the encounter row up front, not at the end, so there's a
  // consistent audit trail of "this record was accessed" even if the
  // clinician never finishes typing notes.
  async start(input: { patientId: string; ticketId: string }): Promise<Encounter> {
    const { data, error } = await supabase
      .from("encounters")
      .insert({
        patient_id: input.patientId,
        ticket_id: input.ticketId,
        clinician_id: PLACEHOLDER_CLINICIAN_ID,
      })
      .select()
      .single();
    if (error || !data) throw new InternalServerErrorException(error?.message ?? "Failed to start encounter");

    const encounter = toEncounter(data);

    // opening a patient's record is a "read" of clinical data — audit it as such
    await this.audit.log({
      actorId: PLACEHOLDER_CLINICIAN_ID,
      actorRole: "clinical",
      action: "read",
      resourceType: "patient",
      resourceId: input.patientId,
    });

    return encounter;
  }

  // Called when the clinician finishes the visit — saves notes/codes and marks it done.
  async complete(id: string, input: { notes: string; diagnosisCodes: string[] }): Promise<Encounter> {
    const { data, error } = await supabase
      .from("encounters")
      .update({
        notes: input.notes,
        diagnosis_codes: input.diagnosisCodes,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new NotFoundException(`Encounter ${id} not found`);

    const encounter = toEncounter(data);

    await this.audit.log({
      actorId: PLACEHOLDER_CLINICIAN_ID,
      actorRole: "clinical",
      action: "update",
      resourceType: "encounter",
      resourceId: encounter.id,
    });

    return encounter;
  }
}