import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { PatientsService } from "./patients.service";

@Controller("patients")
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  // GET /patients/search?q=... — reception search by name/phone/HPRN
  @Get("search")
  search(@Query("q") q: string) {
    if (!q) return [];
    return this.patients.search(q);
  }

  // POST /patients — structured intake, no free-text fields 
  @Post()
  create(
    @Body()
    body: { firstName: string; lastName: string; phoneNumber: string; dateOfBirth: string },
  ) {
    return this.patients.create(body);
  }
}