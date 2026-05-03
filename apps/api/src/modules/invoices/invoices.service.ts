import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  bulkGenerateInvoicesSchema,
  createInvoiceSchema,
  sendInvoiceEmailSchema,
} from "@travel/shared";
import { PrismaService } from "../../common/database/prisma.service";
import { invoicePdfRoot } from "../../common/runtime-paths";
import { EmailService } from "../email/email.service";
import type { BulkGenerateInvoicesDto } from "./dto/bulk-generate-invoices.dto";
import type { CreateInvoiceDto } from "./dto/create-invoice.dto";
import type { SendInvoiceEmailDto } from "./dto/send-invoice-email.dto";

/* helper to include linked policies through junction */
const INVOICE_INCLUDE = {
  partner: true,
  policies: {
    include: {
      policy: {
        select: {
          id: true,
          policyNumber: true,
          primaryTravellerName: true,
          customerEmail: true,
          premiumAmount: true,
          travellers: true,
        },
      },
    },
  },
  emailLogs: { orderBy: { createdAt: "desc" as const }, take: 10 },
} as const;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) { }

  private readonly pdfDirectory = invoicePdfRoot;

  private ensurePdfDirectory() {
    if (!existsSync(this.pdfDirectory)) {
      mkdirSync(this.pdfDirectory, { recursive: true });
    }
  }

  list(scopePartnerId?: string | null) {
    return this.prisma.invoice.findMany({
      where: scopePartnerId ? { partnerId: scopePartnerId } : undefined,
      include: {
        partner: true,
        policies: {
          include: {
            policy: {
              select: {
                id: true,
                policyNumber: true,
                primaryTravellerName: true,
                customerEmail: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  listEligiblePolicies() {
    return this.prisma.policy.findMany({
      where: {
        invoiceLinks: {
          none: {},
        },
      },
      include: {
        partner: true,
        travellers: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: INVOICE_INCLUDE,
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

    const policyIds = parsed.policyIds ?? [];

    /* check none of the selected policies already have an invoice */
    if (policyIds.length > 0) {
      const alreadyLinked = await this.prisma.invoicePolicy.findMany({
        where: { policyId: { in: policyIds } },
        select: { policyId: true },
      });
      if (alreadyLinked.length > 0) {
        throw new ConflictException(
          "One or more selected policies already have an invoice",
        );
      }
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: parsed.invoiceNumber,
        partnerId: parsed.partnerId,
        invoiceDate: new Date(parsed.invoiceDate),
        amount: parsed.amount,
        status: parsed.status,
        pdfUrl: null,
        createdBy: "system@travel-ops.local",
        note: parsed.note || null,
        policies:
          policyIds.length > 0
            ? {
              create: policyIds.map((policyId) => ({
                policyId,
              })),
            }
            : undefined,
      },
      include: {
        partner: true,
        policies: {
          include: {
            policy: {
              select: {
                id: true,
                policyNumber: true,
                primaryTravellerName: true,
                customerEmail: true,
              },
            },
          },
        },
      },
    });

    return invoice;
  }

  async bulkGenerate(input: BulkGenerateInvoicesDto) {
    const parsed = bulkGenerateInvoicesSchema.parse(input);
    const uniquePolicyIds = [...new Set(parsed.policyIds)];

    if (uniquePolicyIds.length !== parsed.policyIds.length) {
      throw new BadRequestException(
        "Duplicate policy IDs are not allowed in bulk generation",
      );
    }

    const policies = await this.prisma.policy.findMany({
      where: {
        id: { in: uniquePolicyIds },
        invoiceLinks: { none: {} },
      },
      include: {
        partner: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (policies.length !== uniquePolicyIds.length) {
      throw new BadRequestException(
        "One or more selected policies are missing or already invoiced",
      );
    }

    const invoiceDate = parsed.invoiceDate
      ? new Date(parsed.invoiceDate)
      : new Date();
    const status = parsed.status || "READY";

    /* Create one combined invoice covering all selected policies */
    const totalAmount = policies.reduce(
      (sum, p) => sum + Number(p.premiumAmount ?? 0),
      0,
    );

    const firstPolicy = policies[0];
    if (!firstPolicy) {
      throw new BadRequestException("No valid policies found");
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: this.generateInvoiceNumber(1),
        partnerId: firstPolicy.partnerId,
        invoiceDate,
        amount: totalAmount,
        status,
        pdfUrl: null,
        createdBy: "system@travel-ops.local",
        note:
          parsed.note ||
          `Combined invoice for ${policies.length} policies.`,
        policies: {
          create: policies.map((policy) => ({
            policyId: policy.id,
            premiumAmount: policy.premiumAmount ?? 0,
          })),
        },
      },
      include: {
        partner: true,
        policies: {
          include: {
            policy: {
              select: {
                id: true,
                policyNumber: true,
                primaryTravellerName: true,
                customerEmail: true,
              },
            },
          },
        },
      },
    });

    return [invoice];
  }

  async getOrGeneratePdf(id: string, forceRegenerate = false) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: INVOICE_INCLUDE,
    });

    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }

    if (!forceRegenerate && invoice.pdfUrl) {
      return {
        fileUrl: invoice.pdfUrl,
        fileName:
          invoice.pdfUrl.split("/").pop() ||
          `${invoice.invoiceNumber}-invoice.pdf`,
      };
    }

    this.ensurePdfDirectory();

    const bytes = await this.buildInvoicePdf(invoice);
    const filename = `${invoice.invoiceNumber}-invoice.pdf`;
    const path = resolve(this.pdfDirectory, filename);
    await writeFile(path, bytes);

    const fileUrl = `/uploads/pdfs/invoices/${filename}`;

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl: fileUrl },
    });

    return { fileUrl, fileName: filename };
  }

  /* ─── redesigned invoice PDF ─── */
  private async buildInvoicePdf(invoice: {
    invoiceNumber: string;
    invoiceDate: Date;
    amount: { toString(): string };
    status: string;
    note: string | null;
    partner: {
      name: string;
      bankName?: string | null;
      bankAccountNumber?: string | null;
      ifscCode?: string | null;
      companyNameForInvoice?: string | null;
      gstNumber?: string | null;
      email?: string | null;
      phone?: string | null;
    };
    policies: Array<{
      premiumAmount?: { toString(): string } | null;
      policy: {
        policyNumber: string;
        primaryTravellerName: string;
        premiumAmount?: { toString(): string } | null;
        travellers: Array<{
          travellerName: string;
          passportNumber: string;
          planName?: string | null;
          premiumAmount?: { toString(): string } | null;
        }>;
      };
    }>;
  }) {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const left = 40;
    const right = 555;
    let y = 790;
    const teal = rgb(0.06, 0.39, 0.36);
    const dark = rgb(0.1, 0.13, 0.18);
    const muted = rgb(0.45, 0.47, 0.5);
    const lineColor = rgb(0.85, 0.87, 0.89);

    /* header */
    page.drawText("TAX INVOICE", { x: left, y, size: 18, font: bold, color: teal });
    y -= 24;
    page.drawText(`Invoice No: ${invoice.invoiceNumber}`, { x: left, y, size: 10, font: bold, color: dark });
    page.drawText(`Date: ${invoice.invoiceDate.toISOString().slice(0, 10)}`, { x: 350, y, size: 10, font, color: dark });
    y -= 16;
    page.drawText(`Status: ${invoice.status}`, { x: left, y, size: 9, font, color: muted });

    /* partner address block */
    y -= 28;
    page.drawRectangle({ x: left, y: y - 60, width: right - left, height: 70, color: rgb(0.97, 0.98, 0.99) });
    page.drawText("Bill To:", { x: left + 8, y: y - 4, size: 9, font: bold, color: muted });
    y -= 18;
    page.drawText(invoice.partner.companyNameForInvoice || invoice.partner.name, { x: left + 8, y: y - 4, size: 11, font: bold, color: dark });
    y -= 16;
    if (invoice.partner.gstNumber) {
      page.drawText(`GSTIN: ${invoice.partner.gstNumber}`, { x: left + 8, y: y - 4, size: 9, font, color: dark });
      y -= 14;
    }
    if (invoice.partner.email) {
      page.drawText(`Email: ${invoice.partner.email}`, { x: left + 8, y: y - 4, size: 9, font, color: dark });
      y -= 14;
    }
    if (invoice.partner.phone) {
      page.drawText(`Phone: ${invoice.partner.phone}`, { x: left + 8, y: y - 4, size: 9, font, color: dark });
    }

    /* traveller table */
    y -= 40;
    const colX: [number, number, number, number, number, number, number] = [left, left + 30, left + 170, left + 310, left + 370, left + 440, right];
    const headers = ["Sr.", "Name of Traveller", "Policy / Certificate No.", "Basic Amt", "GST (18%)", "Total"];

    /* table header row */
    page.drawRectangle({ x: left, y: y - 2, width: right - left, height: 18, color: rgb(0.06, 0.39, 0.36) });
    headers.forEach((h, i) => {
      page.drawText(h, { x: colX[i]! + 4, y: y + 2, size: 8, font: bold, color: rgb(1, 1, 1) });
    });
    y -= 18;

    /* traveller rows */
    let serial = 0;
    let grandBasic = 0;
    let grandGst = 0;
    let grandTotal = 0;

    for (const link of invoice.policies) {
      for (const trav of link.policy.travellers) {
        serial++;
        const basic = Number(trav.premiumAmount?.toString() ?? link.premiumAmount?.toString() ?? 0);
        const gst = Math.round(basic * 0.18);
        const total = basic + gst;
        grandBasic += basic;
        grandGst += gst;
        grandTotal += total;

        /* alternate row shading */
        if (serial % 2 === 0) {
          page.drawRectangle({ x: left, y: y - 2, width: right - left, height: 16, color: rgb(0.97, 0.98, 0.99) });
        }

        page.drawText(String(serial), { x: colX[0] + 4, y: y + 1, size: 8, font, color: dark });
        page.drawText((trav.travellerName || "—").slice(0, 28), { x: colX[1] + 4, y: y + 1, size: 8, font, color: dark });
        page.drawText(link.policy.policyNumber, { x: colX[2] + 4, y: y + 1, size: 8, font, color: dark });
        page.drawText(`Rs. ${basic.toLocaleString("en-IN")}`, { x: colX[3] + 4, y: y + 1, size: 8, font, color: dark });
        page.drawText(`Rs. ${gst.toLocaleString("en-IN")}`, { x: colX[4] + 4, y: y + 1, size: 8, font, color: dark });
        page.drawText(`Rs. ${total.toLocaleString("en-IN")}`, { x: colX[5] + 4, y: y + 1, size: 8, font: bold, color: dark });
        y -= 16;

        if (y < 80) {
          /* add a new page if needed */
          break;
        }
      }
    }

    /* totals row */
    page.drawLine({ start: { x: left, y: y + 14 }, end: { x: right, y: y + 14 }, thickness: 0.5, color: lineColor });
    page.drawRectangle({ x: left, y: y - 4, width: right - left, height: 18, color: rgb(0.95, 0.97, 0.98) });
    page.drawText("TOTAL", { x: colX[1] + 4, y: y, size: 9, font: bold, color: dark });
    page.drawText(`Rs. ${grandBasic.toLocaleString("en-IN")}`, { x: colX[3] + 4, y: y, size: 9, font: bold, color: dark });
    page.drawText(`Rs. ${grandGst.toLocaleString("en-IN")}`, { x: colX[4] + 4, y: y, size: 9, font: bold, color: dark });
    page.drawText(`Rs. ${grandTotal.toLocaleString("en-IN")}`, { x: colX[5] + 4, y: y, size: 9, font: bold, color: teal });
    y -= 28;

    /* IGST breakdown */
    page.drawText("Tax Breakup (IGST @ 18%)", { x: left, y, size: 9, font: bold, color: muted });
    y -= 14;
    page.drawText(`Taxable Amount: Rs. ${grandBasic.toLocaleString("en-IN")}   |   IGST: Rs. ${grandGst.toLocaleString("en-IN")}   |   Total: Rs. ${grandTotal.toLocaleString("en-IN")}`, { x: left, y, size: 9, font, color: dark });
    y -= 24;

    /* payment instructions */
    if (invoice.partner.bankName) {
      page.drawText("Payment Details:", { x: left, y, size: 9, font: bold, color: muted });
      y -= 14;
      const bankLines = [
        `Bank: ${invoice.partner.bankName}`,
        invoice.partner.bankAccountNumber ? `A/C No: ${invoice.partner.bankAccountNumber}` : null,
        invoice.partner.ifscCode ? `IFSC: ${invoice.partner.ifscCode}` : null,
      ].filter(Boolean) as string[];
      for (const line of bankLines) {
        page.drawText(line, { x: left, y, size: 9, font, color: dark });
        y -= 14;
      }
    }

    /* note */
    if (invoice.note) {
      y -= 8;
      page.drawText(`Note: ${invoice.note}`, { x: left, y, size: 8, font, color: muted });
    }

    return pdf.save();
  }

  async sendInvoiceEmail(
    id: string,
    input: SendInvoiceEmailDto,
    sentBy: string | null,
  ) {
    const parsed = sendInvoiceEmailSchema.parse(input);

    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        partner: true,
        policies: {
          include: {
            policy: {
              select: {
                id: true,
                policyNumber: true,
                primaryTravellerName: true,
                customerEmail: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }

    const pdf = await this.getOrGeneratePdf(id);
    const subject =
      parsed.subject?.trim() || `Invoice ${invoice.invoiceNumber}`;

    const policyNumbers = invoice.policies
      .map((lnk) => lnk.policy.policyNumber)
      .join(", ");

    const text = [
      parsed.message?.trim() ||
      `Please find attached invoice ${invoice.invoiceNumber}.`,
      "",
      `Invoice Number: ${invoice.invoiceNumber}`,
      `Partner: ${invoice.partner.name}`,
      `Linked Policies: ${policyNumbers || "N/A"}`,
      `Amount: ${invoice.amount.toString()}`,
    ].join("\n");

    const attachmentPath = resolve(this.pdfDirectory, pdf.fileName);

    try {
      await this.emailService.send({
        to: parsed.recipientEmail,
        subject,
        text,
        attachments: [
          {
            filename: pdf.fileName,
            path: attachmentPath,
            contentType: "application/pdf",
          },
        ],
      });

      const log = await this.prisma.emailLog.create({
        data: {
          invoiceId: id,
          recipientEmail: parsed.recipientEmail,
          subject,
          message: parsed.message?.trim() || null,
          provider: this.emailService.getProviderLabel(),
          status: "SENT",
          sentBy,
          sentAt: new Date(),
        },
      });

      await this.prisma.invoice.update({
        where: { id },
        data: { status: "SENT" },
      });

      return { ok: true, log };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invoice email sending failed";

      const log = await this.prisma.emailLog.create({
        data: {
          invoiceId: id,
          recipientEmail: parsed.recipientEmail,
          subject,
          message: parsed.message?.trim() || null,
          provider: this.emailService.getProviderLabel(),
          status: "FAILED",
          errorMessage: message,
          sentBy,
        },
      });

      throw new BadRequestException(log.errorMessage || "Invoice email failed");
    }
  }

  private generateInvoiceNumber(sequence: number) {
    const stamp = Date.now().toString().slice(-8);
    return `INV-${stamp}${String(sequence).padStart(2, "0")}`;
  }
}
