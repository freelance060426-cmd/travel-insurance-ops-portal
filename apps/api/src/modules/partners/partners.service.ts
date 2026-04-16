import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { partnerCreateSchema } from "@travel/shared";
import { PrismaService } from "../../common/database/prisma.service";
import type { CreatePartnerDto } from "./dto/create-partner.dto";

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.partner.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
    });

    if (!partner) {
      throw new NotFoundException("Partner not found");
    }

    return partner;
  }

  async create(input: CreatePartnerDto) {
    const parsed = partnerCreateSchema.parse(input);

    const existing = await this.prisma.partner.findUnique({
      where: { partnerCode: parsed.partnerCode },
    });

    if (existing) {
      throw new ConflictException("Partner code already exists");
    }

    return this.prisma.partner.create({
      data: {
        partnerCode: parsed.partnerCode,
        name: parsed.name,
        contactName: parsed.contactName || null,
        email: parsed.email || null,
        phone: parsed.phone || null,
      },
    });
  }
}
