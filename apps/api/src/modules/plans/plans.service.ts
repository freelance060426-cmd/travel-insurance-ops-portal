import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service";

type PlanListQuery = Record<string, string | undefined>;

@Injectable()
export class PlansService {
    constructor(private readonly prisma: PrismaService) { }

    list(query: PlanListQuery = {}) {
        const { region, days } = query;
        const daysNum = days ? Number.parseInt(days, 10) : null;

        return this.prisma.plan.findMany({
            where: {
                isActive: true,
                ...(region ? { region: { equals: region, mode: "insensitive" } } : {}),
                ...(daysNum && !Number.isNaN(daysNum)
                    ? {
                        AND: [
                            { OR: [{ minDays: null }, { minDays: { lte: daysNum } }] },
                            { OR: [{ maxDays: null }, { maxDays: { gte: daysNum } }] },
                        ],
                    }
                    : {}),
            },
            orderBy: { name: "asc" },
        });
    }
}
