import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";

type ReportQuery = Record<string, string | undefined>;

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

function toDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function escapeCsv(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) { }

  async getDashboard(scopePartnerId?: string | null) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const policyScope = scopePartnerId ? { partnerId: scopePartnerId } : {};
    const invoiceScope = scopePartnerId ? { partnerId: scopePartnerId } : {};

    const [
      totalPolicies,
      todayPolicies,
      monthlyPolicies,
      totalInvoices,
      readyInvoices,
      sentInvoices,
      pendingPdfPolicies,
      emailSendsToday,
      recentPolicies,
      recentActions,
      topPartner,
    ] = await Promise.all([
      this.prisma.policy.count({ where: policyScope }),
      this.prisma.policy.count({
        where: { ...policyScope, issueDate: { gte: todayStart, lte: todayEnd } },
      }),
      this.prisma.policy.count({
        where: { ...policyScope, issueDate: { gte: monthStart } },
      }),
      this.prisma.invoice.count({ where: invoiceScope }),
      this.prisma.invoice.count({ where: { ...invoiceScope, status: "READY" } }),
      this.prisma.invoice.count({ where: { ...invoiceScope, status: "SENT" } }),
      this.prisma.policy.count({
        where: {
          ...policyScope,
          documents: {
            none: { sourceType: "GENERATED_PDF" },
          },
        },
      }),
      this.prisma.emailLog.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      this.prisma.policy.findMany({
        where: policyScope,
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: { partner: true, travellers: true },
      }),
      this.prisma.policyAction.findMany({
        where: scopePartnerId ? { policy: { partnerId: scopePartnerId } } : undefined,
        take: 8,
        orderBy: { doneAt: "desc" },
        include: {
          policy: {
            select: {
              policyNumber: true,
              primaryTravellerName: true,
            },
          },
        },
      }),
      this.prisma.policy.groupBy({
        by: ["partnerId"],
        ...(scopePartnerId ? { where: { partnerId: scopePartnerId } } : {}),
        _count: { _all: true },
        orderBy: { _count: { partnerId: "desc" } },
        take: 1,
      }),
    ]);

    const topPartnerRecord = topPartner[0]
      ? await this.prisma.partner.findUnique({
        where: { id: topPartner[0].partnerId },
      })
      : null;

    return {
      metrics: {
        totalPolicies,
        todayPolicies,
        monthlyPolicies,
        totalInvoices,
        readyInvoices,
        sentInvoices,
        pendingPdfPolicies,
        emailSendsToday,
      },
      topPartner: topPartnerRecord
        ? {
          id: topPartnerRecord.id,
          name: topPartnerRecord.name,
          policyCount: topPartner[0]?._count._all ?? 0,
        }
        : null,
      recentPolicies,
      recentActions,
    };
  }

  getPolicyWhere(query: ReportQuery): Prisma.PolicyWhereInput {
    const issueFrom = toDate(query.issueFrom);
    const issueTo = toDate(query.issueTo);
    const search = query.search?.trim();

    return {
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
  }

  async getPolicyReport(query: ReportQuery) {
    const where = this.getPolicyWhere(query);
    const rows = await this.prisma.policy.findMany({
      where,
      include: {
        partner: true,
        travellers: true,
        invoiceLinks: true,
        documents: true,
      },
      orderBy: { issueDate: "desc" },
      take: 500,
    });

    return {
      total: rows.length,
      rows,
    };
  }

  async getPartnerReport(query: ReportQuery) {
    const issueFrom = toDate(query.issueFrom);
    const issueTo = toDate(query.issueTo);

    const partners = await this.prisma.partner.findMany({
      include: {
        policies: {
          where:
            issueFrom || issueTo
              ? {
                issueDate: {
                  ...(issueFrom ? { gte: startOfDay(issueFrom) } : {}),
                  ...(issueTo ? { lte: endOfDay(issueTo) } : {}),
                },
              }
              : undefined,
          include: {
            invoiceLinks: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return partners.map((partner) => {
      const totalPremium = partner.policies.reduce(
        (sum, policy) => sum + Number(policy.premiumAmount ?? 0),
        0,
      );
      const invoiceCount = partner.policies.reduce(
        (sum, policy) => sum + policy.invoiceLinks.length,
        0,
      );

      return {
        id: partner.id,
        partnerCode: partner.partnerCode,
        name: partner.name,
        status: partner.status,
        policyCount: partner.policies.length,
        invoiceCount,
        totalPremium,
      };
    });
  }

  async exportPolicyReport(query: ReportQuery) {
    const report = await this.getPolicyReport(query);
    const header = [
      "Policy Number",
      "Traveller",
      "Passport",
      "Partner",
      "Issue Date",
      "Travel Start",
      "Travel End",
      "Status",
      "Premium",
      "Invoice Count",
      "Document Count",
    ];

    const lines = report.rows.map((policy) =>
      [
        policy.policyNumber,
        policy.primaryTravellerName,
        policy.travellers[0]?.passportNumber ?? "",
        policy.partner.name,
        policy.issueDate.toISOString().slice(0, 10),
        policy.startDate.toISOString().slice(0, 10),
        policy.endDate.toISOString().slice(0, 10),
        policy.status,
        policy.premiumAmount?.toString() ?? "0",
        policy.invoiceLinks.length,
        policy.documents.length,
      ]
        .map(escapeCsv)
        .join(","),
    );

    return [header.map(escapeCsv).join(","), ...lines].join("\n");
  }
}
