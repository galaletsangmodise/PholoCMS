import { Module } from "@nestjs/common";
import { PatientsModule } from "./modules/patients/patients.module";
import { QueueModule } from "./modules/queue/queue.module";
import { AuditModule } from "./modules/audit/audit.module";
import { EncountersModule } from "./modules/encounters/encounters.module";

@Module({
  imports: [PatientsModule, QueueModule, AuditModule, EncountersModule],
})
export class AppModule {}