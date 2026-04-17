import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";
import { PoliciesController } from "./policies.controller";
import { PoliciesService } from "./policies.service";

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [PoliciesController],
  providers: [PoliciesService],
})
export class PoliciesModule {}
