import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  createPolicyRequestSchema,
  endorsePolicyRequestSchema,
} from "@travel/shared";
import { PrismaService } from "../../common/database/prisma.service";
import type { CreatePolicyDto } from "./dto/create-policy.dto";
import type { EndorsePolicyDto } from "./dto/endorse-policy.dto";

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.policy.findMany({
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
        invoices: true,
      },
    });

    if (!policy) {
      throw new NotFoundException("Policy not found");
    }

    return policy;
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
            ageOrDob: traveller.ageOrDob || null,
            email: traveller.email || null,
            mobile: traveller.mobile || null,
            planName: traveller.planName || null,
            premiumAmount: traveller.premiumAmount,
          })),
        },
        actions: {
          create: {
            actionType: "CREATE",
            actionSummary: "Policy created through phase 1 manual-first flow",
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
            ageOrDob: traveller.ageOrDob || null,
            email: traveller.email || null,
            mobile: traveller.mobile || null,
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
        invoices: true,
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
}
