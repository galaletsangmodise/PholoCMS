import { Module } from "@nestjs/common";
import { PatientsModule } from "./modules/patients/patients.module";

@Module({
  imports: [PatientsModule],
})
export class AppModule {}