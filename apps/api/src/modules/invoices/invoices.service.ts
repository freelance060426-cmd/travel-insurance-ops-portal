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

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

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
        policy: {
          select: {
            id: true,
            policyNumber: true,
            primaryTravellerName: true,
            customerEmail: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  listEligiblePolicies() {
    return this.prisma.policy.findMany({
      where: {
        invoices: {
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
      include: {
        partner: true,
        policy: {
          select: {
            id: true,
            policyNumber: true,
            primaryTravellerName: true,
            customerEmail: true,
          },
        },
        emailLogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
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

    if (parsed.policyId) {
      const linked = await this.prisma.invoice.findFirst({
        where: { policyId: parsed.policyId },
      });

      if (linked) {
        throw new ConflictException("This policy already has an invoice");
      }
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
        policy: {
          select: {
            id: true,
            policyNumber: true,
            primaryTravellerName: true,
            customerEmail: true,
          },
        },
      },
    });
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
        invoices: { none: {} },
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

    const created = await this.prisma.$transaction(
      policies.map((policy, index) =>
        this.prisma.invoice.create({
          data: {
            invoiceNumber: this.generateInvoiceNumber(index + 1),
            policyId: policy.id,
            partnerId: policy.partnerId,
            invoiceDate,
            amount: policy.premiumAmount ?? 0,
            status,
            pdfUrl: null,
            createdBy: "system@travel-ops.local",
            note:
              parsed.note ||
              `Auto-generated invoice for eligible policy ${policy.policyNumber}.`,
          },
          include: {
            partner: true,
            policy: {
              select: {
                id: true,
                policyNumber: true,
                primaryTravellerName: true,
                customerEmail: true,
              },
            },
          },
        }),
      ),
    );

    return created;
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
        policy: {
          select: {
            id: true,
            policyNumber: true,
            primaryTravellerName: true,
            customerEmail: true,
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
    const text = [
      parsed.message?.trim() ||
        `Please find attached invoice ${invoice.invoiceNumber}.`,
      "",
      `Invoice Number: ${invoice.invoiceNumber}`,
      `Partner: ${invoice.partner.name}`,
      `Linked Policy: ${invoice.policy?.policyNumber ?? "N/A"}`,
      `Amount: ${invoice.amount.toString()}`,
    ].join("\n");

    const attachmentPath = resolve(
      this.pdfDirectory,
      pdf.fileName,
    );

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
        data: {
          status: "SENT",
        },
      });

      return {
        ok: true,
        log,
      };
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
