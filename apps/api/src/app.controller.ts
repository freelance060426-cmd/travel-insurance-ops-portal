import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./common/database/prisma.service";

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("health")
  async getHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      ok: true,
      service: "travel-insurance-ops-api",
      database: "connected",
    };
  }
}
