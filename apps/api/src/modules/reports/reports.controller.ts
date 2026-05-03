import { Controller, Get, Query, Req, Res, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { ReportsService } from "./reports.service";

type ReqUser = { sub: string; email: string; role: string; partnerId: string | null };

@Controller("reports")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get("dashboard")
  getDashboard(@Req() request: { user?: ReqUser }) {
    const user = request.user!;
    return this.reportsService.getDashboard(
      user.role === "PARTNER" ? user.partnerId : null,
    );
  }

  @Get("policies")
  @Roles("SUPER_ADMIN")
  getPolicyReport(@Query() query: Record<string, string | undefined>) {
    return this.reportsService.getPolicyReport(query);
  }

  @Get("partners")
  @Roles("SUPER_ADMIN")
  getPartnerReport(@Query() query: Record<string, string | undefined>) {
    return this.reportsService.getPartnerReport(query);
  }

  @Get("policies/export")
  @Roles("SUPER_ADMIN")
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
