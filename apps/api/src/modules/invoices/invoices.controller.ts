import { Body, Controller, ForbiddenException, Get, Param, Post, Req } from "@nestjs/common";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { InvoicesService } from "./invoices.service";
import type { CreateInvoiceDto } from "./dto/create-invoice.dto";
import type { BulkGenerateInvoicesDto } from "./dto/bulk-generate-invoices.dto";
import type { SendInvoiceEmailDto } from "./dto/send-invoice-email.dto";

type ReqUser = { sub: string; email: string; role: string; partnerId: string | null };

@Controller("invoices")
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) { }

  @Get()
  listInvoices(@Req() request: { user?: ReqUser }) {
    const user = request.user!;
    return this.invoicesService.list(
      user.role === "PARTNER" ? user.partnerId : null,
    );
  }

  @Get("eligible-policies")
  @Roles("SUPER_ADMIN")
  listEligiblePolicies() {
    return this.invoicesService.listEligiblePolicies();
  }

  @Get(":id")
  async getInvoice(@Param("id") id: string, @Req() request: { user?: ReqUser }) {
    const invoice = await this.invoicesService.getById(id);
    const user = request.user!;
    if (user.role === "PARTNER" && user.partnerId && invoice.partnerId !== user.partnerId) {
      throw new ForbiddenException("Access denied");
    }
    return invoice;
  }

  @Post()
  @Roles("SUPER_ADMIN")
  createInvoice(@Body() body: CreateInvoiceDto) {
    return this.invoicesService.create(body);
  }

  @Post("bulk-generate")
  @Roles("SUPER_ADMIN")
  bulkGenerateInvoices(@Body() body: BulkGenerateInvoicesDto) {
    return this.invoicesService.bulkGenerate(body);
  }

  @Get(":id/pdf")
  getOrGeneratePdf(@Param("id") id: string) {
    return this.invoicesService.getOrGeneratePdf(id);
  }

  @Post(":id/pdf/regenerate")
  @Roles("SUPER_ADMIN")
  regeneratePdf(@Param("id") id: string) {
    return this.invoicesService.getOrGeneratePdf(id, true);
  }

  @Post(":id/email")
  @Roles("SUPER_ADMIN")
  sendInvoiceEmail(
    @Param("id") id: string,
    @Body() body: SendInvoiceEmailDto,
    @Req() request: { user?: { email?: string } },
  ) {
    return this.invoicesService.sendInvoiceEmail(
      id,
      body,
      request.user?.email || null,
    );
  }
}
