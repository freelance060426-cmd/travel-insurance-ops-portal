import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createPolicyRequestSchema,
  endorsePolicyRequestSchema,
  sendPolicyEmailSchema,
} from "@travel/shared";
import { PrismaService } from "../../common/database/prisma.service";
import { policyPdfRoot, uploadsRoot } from "../../common/runtime-paths";
import { EmailService } from "../email/email.service";
import type { CreatePolicyDto } from "./dto/create-policy.dto";
import type { EndorsePolicyDto } from "./dto/endorse-policy.dto";
import type { SendPolicyEmailDto } from "./dto/send-policy-email.dto";

type PolicyListQuery = Record<string, string | undefined>;

function toDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

@Injectable()
export class PoliciesService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) { }

  private readonly pdfDirectory = policyPdfRoot;
  private expiryTimer: NodeJS.Timeout | null = null;

  async onModuleInit() {
    await this.expirePastPolicies();
    this.expiryTimer = setInterval(
      () => {
        void this.expirePastPolicies();
      },
      24 * 60 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.expiryTimer) {
      clearInterval(this.expiryTimer);
    }
  }

  private ensurePdfDirectory() {
    if (!existsSync(this.pdfDirectory)) {
      mkdirSync(this.pdfDirectory, { recursive: true });
    }
  }

  async expirePastPolicies(now = new Date()) {
    const expirable = await this.prisma.policy.findMany({
      where: {
        endDate: { lt: now },
        status: { in: ["DRAFT", "ACTIVE", "ENDORSED"] },
      },
      select: {
        id: true,
        policyNumber: true,
        status: true,
        endDate: true,
      },
    });

    if (!expirable.length) {
      return { expired: 0 };
    }

    await this.prisma.$transaction([
      this.prisma.policy.updateMany({
        where: { id: { in: expirable.map((policy) => policy.id) } },
        data: { status: "EXPIRED" },
      }),
      this.prisma.policyAction.createMany({
        data: expirable.map((policy) => ({
          policyId: policy.id,
          actionType: "AUTO_EXPIRE",
          actionSummary: `Policy auto-expired after travel end date ${policy.endDate.toISOString().slice(0, 10)}`,
          beforeJson: {
            status: policy.status,
            endDate: policy.endDate,
          },
          afterJson: {
            status: "EXPIRED",
          },
          doneBy: "system@travel-ops.local",
        })),
      }),
    ]);

    return { expired: expirable.length };
  }

  list(query: PolicyListQuery = {}) {
    const search = query.search?.trim();
    const issueFrom = toDate(query.issueFrom);
    const issueTo = toDate(query.issueTo);
    const where: Prisma.PolicyWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.partnerId ? { partnerId: query.partnerId } : {}),
      ...(issueFrom || issueTo
        ? {
          issueDate: {
            ...(issueFrom ? { gte: startOfDay(issueFrom) } : {}),
            ...(issueTo ? { lte: endOfDay(issueTo) } : {}),
          },
        }
        : {}),
      ...(search
        ? {
          OR: [
            { policyNumber: { contains: search, mode: "insensitive" } },
            {
              primaryTravellerName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              partner: {
                name: { contains: search, mode: "insensitive" },
              },
            },
            {
              travellers: {
                some: {
                  passportNumber: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
        : {}),
    };

    return this.prisma.policy.findMany({
      where,
      include: {
        partner: true,
        travellers: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        partner: true,
        travellers: true,
        documents: true,
        actions: true,
        invoiceLinks: true,
        emailLogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!policy) {
      throw new NotFoundException("Policy not found");
    }

    return policy;
  }

  async checkPassport(passport: string) {
    if (!passport || passport.trim().length === 0) {
      return { exists: false };
    }

    const traveller = await this.prisma.policyTraveller.findFirst({
      where: {
        passportNumber: { equals: passport.trim(), mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      include: {
        policy: {
          select: {
            policyNumber: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
    });

    if (!traveller) {
      return { exists: false };
    }

    return {
      exists: true,
      policyNumber: traveller.policy.policyNumber,
      startDate: traveller.policy.startDate,
      endDate: traveller.policy.endDate,
      status: traveller.policy.status,
      traveller: {
        travellerName: traveller.travellerName,
        passportNumber: traveller.passportNumber,
        gender: traveller.gender,
        dateOfBirth: traveller.dateOfBirth,
        age: traveller.age,
        nominee: traveller.nominee,
        nomineeRelationship: traveller.nomineeRelationship,
        address: traveller.address,
        pincode: traveller.pincode,
        city: traveller.city,
        district: traveller.district,
        state: traveller.state,
        country: traveller.country,
        email: traveller.email,
        mobile: traveller.mobile,
        emergencyContactPerson: traveller.emergencyContactPerson,
        emergencyContactNumber: traveller.emergencyContactNumber,
        emergencyEmail: traveller.emergencyEmail,
      },
    };
  }

  async create(input: CreatePolicyDto) {
    const parsed = createPolicyRequestSchema.parse(input);

    const existing = await this.prisma.policy.findUnique({
      where: { policyNumber: parsed.policyNumber },
    });

    if (existing) {
      throw new ConflictException("Policy number already exists");
    }

    const systemUser = await this.prisma.user.upsert({
      where: { email: "system@travel-ops.local" },
      update: {},
      create: {
        email: "system@travel-ops.local",
        passwordHash: "not-applicable-yet",
        name: "System User",
        role: "SUPER_ADMIN",
      },
    });

    return this.prisma.policy.create({
      data: {
        policyNumber: parsed.policyNumber,
        partnerId: parsed.partnerId,
        issueDate: new Date(parsed.issueDate),
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
        insurerName: parsed.insurerName,
        productCode: parsed.productCode || null,
        travelRegion: parsed.travelRegion || null,
        destination: parsed.destination || null,
        tripDays: parsed.tripDays ?? null,
        primaryTravellerName: parsed.primaryTravellerName,
        customerEmail: parsed.customerEmail || null,
        customerMobile: parsed.customerMobile || null,
        premiumAmount: parsed.premiumAmount,
        status: "DRAFT",
        createdById: systemUser.id,
        travellers: {
          create: parsed.travellers.map((traveller) => ({
            travellerName: traveller.travellerName,
            passportNumber: traveller.passportNumber,
            gender: traveller.gender || null,
            dateOfBirth: traveller.dateOfBirth
              ? new Date(traveller.dateOfBirth)
              : null,
            age: traveller.age ?? null,
            ageOrDob: traveller.ageOrDob || null,
            nominee: traveller.nominee || null,
            nomineeRelationship: traveller.nomineeRelationship || null,
            address: traveller.address || null,
            pincode: traveller.pincode || null,
            city: traveller.city || null,
            district: traveller.district || null,
            state: traveller.state || null,
            country: traveller.country || null,
            email: traveller.email || null,
            mobile: traveller.mobile || null,
            remarks: traveller.remarks || null,
            crReferenceNumber: traveller.crReferenceNumber || null,
            pastIllness: traveller.pastIllness || null,
            emergencyContactPerson: traveller.emergencyContactPerson || null,
            emergencyContactNumber: traveller.emergencyContactNumber || null,
            emergencyEmail: traveller.emergencyEmail || null,
            gstNumber: traveller.gstNumber || null,
            gstState: traveller.gstState || null,
            planName: traveller.planName || null,
            premiumAmount: traveller.premiumAmount,
          })),
        },
        actions: {
          create: {
            actionType: "CREATE",
            actionSummary: "Policy created",
            doneBy: systemUser.id,
          },
        },
      },
      include: {
        partner: true,
        travellers: true,
        actions: true,
      },
    });
  }

  async endorse(id: string, input: EndorsePolicyDto) {
    const parsed = endorsePolicyRequestSchema.parse(input);

    const existing = await this.prisma.policy.findUnique({
      where: { id },
      include: { travellers: true },
    });

    if (!existing) {
      throw new NotFoundException("Policy not found");
    }

    const systemUser = await this.prisma.user.upsert({
      where: { email: "system@travel-ops.local" },
      update: {},
      create: {
        email: "system@travel-ops.local",
        passwordHash: "not-applicable-yet",
        name: "System User",
        role: "SUPER_ADMIN",
      },
    });

    const beforeSnapshot = {
      startDate: existing.startDate,
      endDate: existing.endDate,
      status: existing.status,
      travellers: existing.travellers,
    };

    await this.prisma.policyTraveller.deleteMany({
      where: { policyId: id },
    });

    return this.prisma.policy.update({
      where: { id },
      data: {
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
        travelRegion: parsed.travelRegion || existing.travelRegion,
        destination: parsed.destination || existing.destination,
        status: "ENDORSED",
        primaryTravellerName:
          parsed.travellers[0]?.travellerName || existing.primaryTravellerName,
        customerEmail: parsed.travellers[0]?.email || existing.customerEmail,
        customerMobile:
          parsed.travellers[0]?.mobile || existing.customerMobile,
        updatedById: systemUser.id,
        travellers: {
          create: parsed.travellers.map((traveller) => ({
            travellerName: traveller.travellerName,
            passportNumber: traveller.passportNumber,
            gender: traveller.gender || null,
            dateOfBirth: traveller.dateOfBirth
              ? new Date(traveller.dateOfBirth)
              : null,
            age: traveller.age ?? null,
            ageOrDob: traveller.ageOrDob || null,
            nominee: traveller.nominee || null,
            nomineeRelationship: traveller.nomineeRelationship || null,
            address: traveller.address || null,
            pincode: traveller.pincode || null,
            city: traveller.city || null,
            district: traveller.district || null,
            state: traveller.state || null,
            country: traveller.country || null,
            email: traveller.email || null,
            mobile: traveller.mobile || null,
            remarks: traveller.remarks || null,
            crReferenceNumber: traveller.crReferenceNumber || null,
            pastIllness: traveller.pastIllness || null,
            emergencyContactPerson: traveller.emergencyContactPerson || null,
            emergencyContactNumber: traveller.emergencyContactNumber || null,
            emergencyEmail: traveller.emergencyEmail || null,
            gstNumber: traveller.gstNumber || null,
            gstState: traveller.gstState || null,
            planName: traveller.planName || parsed.preferredPlan || null,
            premiumAmount: traveller.premiumAmount,
          })),
        },
        actions: {
          create: {
            actionType: "ENDORSE",
            actionSummary: parsed.reason,
            beforeJson: beforeSnapshot,
            afterJson: {
              startDate: parsed.startDate,
              endDate: parsed.endDate,
              preferredPlan: parsed.preferredPlan || null,
              travellers: parsed.travellers,
            },
            doneBy: systemUser.id,
          },
        },
      },
      include: {
        partner: true,
        travellers: true,
        documents: true,
        actions: true,
        invoiceLinks: true,
      },
    });
  }

  async addDocument(
    policyId: string,
    file: { originalname: string; mimetype: string; filename: string },
    uploadedBy: string | null,
  ) {
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundException("Policy not found");
    }

    const document = await this.prisma.policyDocument.create({
      data: {
        policyId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileUrl: `/uploads/policies/${file.filename}`,
        sourceType: "MANUAL_UPLOAD",
        uploadedBy,
      },
    });

    await this.prisma.policyAction.create({
      data: {
        policyId,
        actionType: "UPLOAD_DOCUMENT",
        actionSummary: `Document uploaded: ${file.originalname}`,
        doneBy: uploadedBy,
      },
    });

    return document;
  }

  async getOrGeneratePdf(id: string, forceRegenerate = false) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        partner: true,
        travellers: true,
        documents: {
          where: { sourceType: "GENERATED_PDF" },
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!policy) {
      throw new NotFoundException("Policy not found");
    }

    if (!forceRegenerate && policy.documents[0]) {
      return policy.documents[0];
    }

    this.ensurePdfDirectory();

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 790;
    const left = 50;

    page.drawText("Travel Insurance Policy", {
      x: left,
      y,
      size: 22,
      font: bold,
      color: rgb(0.06, 0.39, 0.36),
    });

    y -= 36;
    const lines = [
      `Policy Number: ${policy.policyNumber}`,
      `Partner: ${policy.partner.name}`,
      `Issue Date: ${policy.issueDate.toISOString().slice(0, 10)}`,
      `Travel Start: ${policy.startDate.toISOString().slice(0, 10)}`,
      `Travel End: ${policy.endDate.toISOString().slice(0, 10)}`,
      `Status: ${policy.status}`,
      `Primary Traveller: ${policy.primaryTravellerName}`,
      `Insurer: ${policy.insurerName}`,
      `Premium Amount: ${policy.premiumAmount?.toString() ?? "N/A"}`,
      "",
      "Travellers:",
      ...policy.travellers.map(
        (traveller, index) =>
          `${index + 1}. ${traveller.travellerName} | Passport: ${traveller.passportNumber} | DOB/Age: ${traveller.ageOrDob ?? "N/A"} | Plan: ${traveller.planName ?? "N/A"}`,
      ),
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
    const filename = `${policy.policyNumber}-policy.pdf`;
    const path = resolve(this.pdfDirectory, filename);
    await writeFile(path, bytes);

    if (policy.documents[0]) {
      return this.prisma.policyDocument.update({
        where: { id: policy.documents[0].id },
        data: {
          fileName: filename,
          fileType: "application/pdf",
          fileUrl: `/uploads/pdfs/policies/${filename}`,
          uploadedAt: new Date(),
        },
      });
    }

    return this.prisma.policyDocument.create({
      data: {
        policyId: policy.id,
        fileName: filename,
        fileType: "application/pdf",
        fileUrl: `/uploads/pdfs/policies/${filename}`,
        sourceType: "GENERATED_PDF",
        uploadedBy: "system@travel-ops.local",
      },
    });
  }

  async sendPolicyEmail(
    id: string,
    input: SendPolicyEmailDto,
    sentBy: string | null,
  ) {
    const parsed = sendPolicyEmailSchema.parse(input);

    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        partner: true,
        travellers: true,
      },
    });

    if (!policy) {
      throw new NotFoundException("Policy not found");
    }

    const pdfDocument = await this.getOrGeneratePdf(id);
    const subject = parsed.subject?.trim() || `Policy ${policy.policyNumber}`;
    const text = [
      parsed.message?.trim() ||
      `Please find attached the policy PDF for ${policy.policyNumber}.`,
      "",
      `Policy Number: ${policy.policyNumber}`,
      `Partner: ${policy.partner.name}`,
      `Primary Traveller: ${policy.primaryTravellerName}`,
      `Travel Window: ${policy.startDate.toISOString().slice(0, 10)} to ${policy.endDate.toISOString().slice(0, 10)}`,
    ].join("\n");

    const attachmentPath = resolve(
      uploadsRoot,
      pdfDocument.fileUrl.replace(/^\/uploads\//, ""),
    );

    try {
      await this.emailService.send({
        to: parsed.recipientEmail,
        subject,
        text,
        attachments: [
          {
            filename: pdfDocument.fileName,
            path: attachmentPath,
            contentType: "application/pdf",
          },
        ],
      });

      const log = await this.prisma.emailLog.create({
        data: {
          policyId: id,
          recipientEmail: parsed.recipientEmail,
          subject,
          message: parsed.message?.trim() || null,
          provider: this.emailService.getProviderLabel(),
          status: "SENT",
          sentBy,
          sentAt: new Date(),
        },
      });

      await this.prisma.policyAction.create({
        data: {
          policyId: id,
          actionType: "SEND_EMAIL",
          actionSummary: `Policy emailed to ${parsed.recipientEmail}`,
          doneBy: sentBy,
          afterJson: {
            recipientEmail: parsed.recipientEmail,
            subject,
            emailLogId: log.id,
          },
        },
      });

      return {
        ok: true,
        log,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Email sending failed";

      const log = await this.prisma.emailLog.create({
        data: {
          policyId: id,
          recipientEmail: parsed.recipientEmail,
          subject,
          message: parsed.message?.trim() || null,
          provider: this.emailService.getProviderLabel(),
          status: "FAILED",
          errorMessage: message,
          sentBy,
        },
      });

      await this.prisma.policyAction.create({
        data: {
          policyId: id,
          actionType: "SEND_EMAIL_FAILED",
          actionSummary: `Policy email failed for ${parsed.recipientEmail}`,
          doneBy: sentBy,
          afterJson: {
            recipientEmail: parsed.recipientEmail,
            subject,
            error: message,
            emailLogId: log.id,
          },
        },
      });

      throw error;
    }
  }
}
