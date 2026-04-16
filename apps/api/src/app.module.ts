import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaModule } from "./common/database/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PartnersModule } from "./modules/partners/partners.module";
import { PoliciesModule } from "./modules/policies/policies.module";

@Module({
  imports: [PrismaModule, AuthModule, PartnersModule, PoliciesModule],
  controllers: [AppController],
})
export class AppModule {}
