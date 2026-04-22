import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { InvoicesService } from "./invoices.service";
import type { CreateInvoiceDto } from "./dto/create-invoice.dto";
import type { BulkGenerateInvoicesDto } from "./dto/bulk-generate-invoices.dto";
import type { SendInvoiceEmailDto } from "./dto/send-invoice-email.dto";

@Controller("invoices")
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  listInvoices() {
    return this.invoicesService.list();
  }

  @Get("eligible-policies")
  listEligiblePolicies() {
    return this.invoicesService.listEligiblePolicies();
  }

  @Get(":id")
  getInvoice(@Param("id") id: string) {
    return this.invoicesService.getById(id);
  }

  @Post()
  createInvoice(@Body() body: CreateInvoiceDto) {
    return this.invoicesService.create(body);
  }

  @Post("bulk-generate")
  bulkGenerateInvoices(@Body() body: BulkGenerateInvoicesDto) {
    return this.invoicesService.bulkGenerate(body);
  }

  @Get(":id/pdf")
  getOrGeneratePdf(@Param("id") id: string) {
    return this.invoicesService.getOrGeneratePdf(id);
  }

  @Post(":id/pdf/regenerate")
  regeneratePdf(@Param("id") id: string) {
    return this.invoicesService.getOrGeneratePdf(id, true);
  }

  @Post(":id/email")
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
