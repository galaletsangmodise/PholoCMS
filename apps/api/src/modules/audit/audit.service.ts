import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { supabase } from "../../lib/supabase";
import type { AuditLogEntry } from "@pholo/types";

@Injectable()
export class AuditService {
 
  async log(entry: {
    actorId: string;
    actorRole: AuditLogEntry["actorRole"];
    action: AuditLogEntry["action"];
    resourceType: AuditLogEntry["resourceType"];
    resourceId: string;
  }): Promise<void> {
    const { error } = await supabase.from("audit_log").insert({
      actor_id: entry.actorId,
      actor_role: entry.actorRole,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
    });
    
    if (error) throw new InternalServerErrorException(`Audit log write failed: ${error.message}`);
  }
}