import { Module } from "@nestjs/common";
import { PatientsModule } from "./modules/patients/patients.module";
import { QueueModule } from "./modules/queue/queue.module";

@Module({
  imports: [PatientsModule, QueueModule],
})
export class AppModule {}