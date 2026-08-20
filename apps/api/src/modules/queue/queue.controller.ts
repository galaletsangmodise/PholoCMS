import { Body, Controller, Get, Post, Query } from "@nestjs/common"; 
import { QueueService } from "./queue.service"; 
import { PatientsService } from "../patients/patients.service"; 
import type { CheckInRequest } from "@pholo/types"; 

@Controller("queue")
export class QueueController {
  constructor(
    private readonly queue: QueueService, 
    private readonly patients: PatientsService,
  ) {}

  // POST /queue/check-in — reception check-in, or new-patient intake + check-in 
  @Post("check-in")
  checkIn(@Body() body: CheckInRequest) {
    let patientId = body.patientId; // if checking in an existing patient, this is already set

    if (!patientId && body.newPatient) {
      // no existing patientId, but new patient details were given, register them first
      patientId = this.patients.create(body.newPatient).id;
    }
    if (!patientId) {
      // neither an existing ID nor new patient details, can't proceed
      throw new Error("Either patientId or newPatient is required");
    }

    return this.queue.checkIn({
      patientId,
      facilityId: body.facilityId,
      servicePoint: body.servicePoint,
      source: body.source,
    });
  }

  // GET /queue/snapshot?facilityId=...&servicePoint=...  polled by reception/clinical/patient views.
  @Get("snapshot")
  snapshot(@Query("facilityId") facilityId: string, @Query("servicePoint") servicePoint: string) {
    return this.queue.snapshot(facilityId, servicePoint); // just delegates to the service method
  }

  // POST /queue/call-next, clinical staff pulls the next patient
  @Post("call-next")
  callNext(@Body() body: { facilityId: string; servicePoint: string }) {
    return this.queue.callNext(body.facilityId, body.servicePoint);
  }
}