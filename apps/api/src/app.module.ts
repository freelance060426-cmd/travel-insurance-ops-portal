import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaModule } from "./common/database/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { EmailModule } from "./modules/email/email.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { PartnersModule } from "./modules/partners/partners.module";
import { PlansModule } from "./modules/plans/plans.module";
import { PoliciesModule } from "./modules/policies/policies.module";
import { ReportsModule } from "./modules/reports/reports.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EmailModule,
    PartnersModule,
    PlansModule,
    PoliciesModule,
    InvoicesModule,
    ReportsModule,
  ],
  controllers: [AppController],
})
export class AppModule { }
