import { Module } from "@nestjs/common"; 
import { QueueController } from "./queue.controller"; // handles incoming HTTP requests for /queue
import { QueueService } from "./queue.service"; 
import { PatientsModule } from "../patients/patients.module"; 

@Module({
  imports: [PatientsModule], 
  controllers: [QueueController], 
  providers: [QueueService], 
})
export class QueueModule {}