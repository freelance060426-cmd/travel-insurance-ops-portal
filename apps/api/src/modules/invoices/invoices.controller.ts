import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import type { CreateInvoiceDto } from "./dto/create-invoice.dto";

@Controller("invoices")
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
}
