import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { supabase } from "../../lib/supabase";
import { AuditService } from "../audit/audit.service";
import type { QueueTicket, QueueSnapshot } from "@pholo/types";

function toTicket(row: any): QueueTicket {
  return {
    id: row.id,
    patientId: row.patient_id,
    facilityId: row.facility_id,
    servicePoint: row.service_point,
    status: row.status,
    source: row.source,
    queuePosition: row.queue_position,
    checkedInAt: row.checked_in_at,
    calledAt: row.called_at,
    completedAt: row.completed_at,
  };
}

const PLACEHOLDER_ACTOR = { actorId: "00000000-0000-0000-0000-000000000000", actorRole: "reception" as const };

@Injectable()
export class QueueService {
  constructor(private readonly audit: AuditService) {}

  async checkIn(input: {
    patientId: string;
    facilityId: string;
    servicePoint: string;
    source: QueueTicket["source"];
  }): Promise<QueueTicket> {
    const { count, error: countError } = await supabase
      .from("queue_tickets")
      .select("*", { count: "exact", head: true })
      .eq("facility_id", input.facilityId)
      .eq("service_point", input.servicePoint)
      .eq("status", "waiting");
    if (countError) throw new InternalServerErrorException(countError.message);

    const { data, error } = await supabase
      .from("queue_tickets")
      .insert({
        patient_id: input.patientId,
        facility_id: input.facilityId,
        service_point: input.servicePoint,
        source: input.source,
        status: "waiting",
        queue_position: (count ?? 0) + 1,
      })
      .select()
      .single();
    if (error || !data) throw new InternalServerErrorException(error?.message ?? "Failed to check in");

    const ticket = toTicket(data);
    await this.audit.log({ ...PLACEHOLDER_ACTOR, action: "create", resourceType: "ticket", resourceId: ticket.id });
    return ticket;
  }

  async forServicePoint(facilityId: string, servicePoint: string): Promise<QueueTicket[]> {
    const { data, error } = await supabase
      .from("queue_tickets")
      .select("*")
      .eq("facility_id", facilityId)
      .eq("service_point", servicePoint)
      .order("checked_in_at", { ascending: true });
    if (error) throw new InternalServerErrorException(error.message);
    return (data ?? []).map(toTicket);
  }

  async snapshot(facilityId: string, servicePoint: string): Promise<QueueSnapshot> {
    return {
      facilityId,
      servicePoint,
      tickets: await this.forServicePoint(facilityId, servicePoint),
    };
  }

  async callNext(facilityId: string, servicePoint: string): Promise<QueueTicket | null> {
    const { data: existing, error: findError } = await supabase
      .from("queue_tickets")
      .select("*")
      .eq("facility_id", facilityId)
      .eq("service_point", servicePoint)
      .eq("status", "waiting")
      .order("checked_in_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (findError) throw new InternalServerErrorException(findError.message);
    if (!existing) return null;

    const { data: updated, error: updateError } = await supabase
      .from("queue_tickets")
      .update({ status: "called", called_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    if (updateError || !updated) throw new InternalServerErrorException(updateError?.message ?? "Failed to call next");

    const ticket = toTicket(updated);
    await this.audit.log({ ...PLACEHOLDER_ACTOR, actorRole: "clinical", action: "update", resourceType: "ticket", resourceId: ticket.id });
    return ticket;
  }

  // Marks a ticket as done once the clinician finishes the visit.
  async complete(ticketId: string): Promise<QueueTicket> {
    const { data, error } = await supabase
      .from("queue_tickets")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", ticketId)
      .select()
      .single();
    if (error || !data) throw new InternalServerErrorException(error?.message ?? "Failed to complete ticket");

    const ticket = toTicket(data);
    await this.audit.log({ ...PLACEHOLDER_ACTOR, actorRole: "clinical", action: "update", resourceType: "ticket", resourceId: ticket.id });
    return ticket;
  }
}