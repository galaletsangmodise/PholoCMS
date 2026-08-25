import { Module } from "@nestjs/common";
import { QueueController } from "./queue.controller";
import { QueueService } from "./queue.service";
import { PatientsModule } from "../patients/patients.module";
import { AuditModule } from "../audit/audit.module"; 

@Module({
  imports: [PatientsModule, AuditModule], 
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule {}