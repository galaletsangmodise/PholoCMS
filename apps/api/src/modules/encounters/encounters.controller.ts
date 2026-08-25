import { Body, Controller, Param, Post } from "@nestjs/common";
import { EncountersService } from "./encounters.service";

@Controller("encounters")
export class EncountersController {
  constructor(private readonly encounters: EncountersService) {}

  // POST /encounters/start — clinical staff opens a patient's record
  @Post("start")
  start(@Body() body: { patientId: string; ticketId: string }) {
    return this.encounters.start(body);
  }

  // POST /encounters/:id/complete — finish the visit, save notes + codes
  @Post(":id/complete")
  complete(@Param("id") id: string, @Body() body: { notes: string; diagnosisCodes: string[] }) {
    return this.encounters.complete(id, body);
  }
}