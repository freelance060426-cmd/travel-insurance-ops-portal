import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("dashboard")
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  @Get("policies")
  getPolicyReport(@Query() query: Record<string, string | undefined>) {
    return this.reportsService.getPolicyReport(query);
  }

  @Get("partners")
  getPartnerReport(@Query() query: Record<string, string | undefined>) {
    return this.reportsService.getPartnerReport(query);
  }

  @Get("policies/export")
  async exportPolicyReport(
    @Query() query: Record<string, string | undefined>,
    @Res({ passthrough: true }) response: {
      setHeader: (name: string, value: string) => void;
    },
  ) {
    const csv = await this.reportsService.exportPolicyReport(query);
    response.setHeader("content-type", "text/csv; charset=utf-8");
    response.setHeader(
      "content-disposition",
      'attachment; filename="policy-report.csv"',
    );
    return csv;
  }
}
