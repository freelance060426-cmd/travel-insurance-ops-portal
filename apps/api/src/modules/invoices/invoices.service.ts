import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInvoiceSchema } from "@travel/shared";
import { PrismaService } from "../../common/database/prisma.service";
import { invoicePdfRoot } from "../../common/runtime-paths";
import type { CreateInvoiceDto } from "./dto/create-invoice.dto";

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly pdfDirectory = invoicePdfRoot;

  private ensurePdfDirectory() {
    if (!existsSync(this.pdfDirectory)) {
      mkdirSync(this.pdfDirectory, { recursive: true });
    }
  }

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

  async getOrGeneratePdf(id: string, forceRegenerate = false) {
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

    if (!forceRegenerate && invoice.pdfUrl) {
      return {
        fileUrl: invoice.pdfUrl,
        fileName: invoice.pdfUrl.split("/").pop() || `${invoice.invoiceNumber}-invoice.pdf`,
      };
    }

    this.ensurePdfDirectory();

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 790;
    const left = 50;

    page.drawText("Travel Insurance Invoice", {
      x: left,
      y,
      size: 22,
      font: bold,
      color: rgb(0.06, 0.39, 0.36),
    });

    y -= 36;
    const lines = [
      `Invoice Number: ${invoice.invoiceNumber}`,
      `Invoice Date: ${invoice.invoiceDate.toISOString().slice(0, 10)}`,
      `Partner: ${invoice.partner.name}`,
      `Linked Policy: ${invoice.policy?.policyNumber ?? "N/A"}`,
      `Amount: ${invoice.amount.toString()}`,
      `Status: ${invoice.status}`,
      `Notes: ${invoice.note ?? "N/A"}`,
    ];

    for (const line of lines) {
      page.drawText(line, {
        x: left,
        y,
        size: 11,
        font,
        color: rgb(0.1, 0.13, 0.18),
      });
      y -= 18;
    }

    const bytes = await pdf.save();
    const filename = `${invoice.invoiceNumber}-invoice.pdf`;
    const path = resolve(this.pdfDirectory, filename);
    await writeFile(path, bytes);

    const fileUrl = `/uploads/pdfs/invoices/${filename}`;

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl: fileUrl },
    });

    return {
      fileUrl,
      fileName: filename,
    };
  }
}
