import { Module } from "@nestjs/common";
import { PatientsModule } from "./modules/patients/patients.module";
import { QueueModule } from "./modules/queue/queue.module";
import { AuditModule } from "./modules/audit/audit.module";

@Module({
  imports: [PatientsModule, QueueModule, AuditModule],
})
export class AppModule {}