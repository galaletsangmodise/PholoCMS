import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"; 
import { PatientsService } from "./patients.service";

@Controller("patients")
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get("search")
  search(@Query("q") q: string) {
    if (!q) return [];
    return this.patients.search(q);
  }

  // NEW — GET /patients/:id, used by the clinical screen to load one patient's full record
  @Get(":id")
  findById(@Param("id") id: string) {
    return this.patients.findById(id);
  }

  @Post()
  create(
    @Body()
    body: { firstName: string; lastName: string; phoneNumber: string; dateOfBirth: string },
  ) {
    return this.patients.create(body);
  }
}