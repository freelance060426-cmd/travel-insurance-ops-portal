import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { createInvoiceSchema } from "@travel/shared";
import { PrismaService } from "../../common/database/prisma.service";
import type { CreateInvoiceDto } from "./dto/create-invoice.dto";

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.invoice.findMany({
      include: {
        partner: true,
        policy: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        partner: true,
        policy: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }

    return invoice;
  }

  async create(input: CreateInvoiceDto) {
    const parsed = createInvoiceSchema.parse(input);

    const existing = await this.prisma.invoice.findUnique({
      where: { invoiceNumber: parsed.invoiceNumber },
    });

    if (existing) {
      throw new ConflictException("Invoice number already exists");
    }

    return this.prisma.invoice.create({
      data: {
        invoiceNumber: parsed.invoiceNumber,
        policyId: parsed.policyId || null,
        partnerId: parsed.partnerId,
        invoiceDate: new Date(parsed.invoiceDate),
        amount: parsed.amount,
        status: parsed.status,
        pdfUrl: null,
        createdBy: "system@travel-ops.local",
        note: parsed.note || null,
      },
      include: {
        partner: true,
        policy: true,
      },
    });
  }
}
