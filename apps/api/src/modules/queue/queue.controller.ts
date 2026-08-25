import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"; 
import { QueueService } from "./queue.service";
import { PatientsService } from "../patients/patients.service";
import type { CheckInRequest } from "@pholo/types";

@Controller("queue")
export class QueueController {
  constructor(
    private readonly queue: QueueService,
    private readonly patients: PatientsService,
  ) {}

  @Post("check-in")
  checkIn(@Body() body: CheckInRequest) {
    let patientId = body.patientId;
    if (!patientId && body.newPatient) {
      patientId = this.patients.create(body.newPatient) as any; // note: see gap below
    }
    if (!patientId) throw new Error("Either patientId or newPatient is required");

    return this.queue.checkIn({
      patientId,
      facilityId: body.facilityId,
      servicePoint: body.servicePoint,
      source: body.source,
    });
  }

  @Get("snapshot")
  snapshot(@Query("facilityId") facilityId: string, @Query("servicePoint") servicePoint: string) {
    return this.queue.snapshot(facilityId, servicePoint);
  }

  @Post("call-next")
  callNext(@Body() body: { facilityId: string; servicePoint: string }) {
    return this.queue.callNext(body.facilityId, body.servicePoint);
  }

  // NEW — POST /queue/:id/complete, called once a clinician finishes an encounter
  @Post(":id/complete")
  complete(@Param("id") id: string) {
    return this.queue.complete(id);
  }
}