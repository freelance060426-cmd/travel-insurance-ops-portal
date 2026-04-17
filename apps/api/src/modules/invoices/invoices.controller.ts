import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { InvoicesService } from "./invoices.service";
import type { CreateInvoiceDto } from "./dto/create-invoice.dto";

@Controller("invoices")
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  listInvoices() {
    return this.invoicesService.list();
  }

  @Get(":id")
  getInvoice(@Param("id") id: string) {
    return this.invoicesService.getById(id);
  }

  @Post()
  createInvoice(@Body() body: CreateInvoiceDto) {
    return this.invoicesService.create(body);
  }

  @Get(":id/pdf")
  getOrGeneratePdf(@Param("id") id: string) {
    return this.invoicesService.getOrGeneratePdf(id);
  }

  @Post(":id/pdf/regenerate")
  regeneratePdf(@Param("id") id: string) {
    return this.invoicesService.getOrGeneratePdf(id, true);
  }
}
