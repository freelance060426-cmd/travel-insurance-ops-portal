import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { PartnersService } from "./partners.service";
import type { CreatePartnerDto } from "./dto/create-partner.dto";

@Controller("partners")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  listPartners() {
    return this.partnersService.list();
  }

  @Get(":id")
  getPartner(@Param("id") id: string) {
    return this.partnersService.getById(id);
  }

  @Post()
  @Roles("SUPER_ADMIN")
  createPartner(@Body() body: CreatePartnerDto) {
    return this.partnersService.create(body);
  }
}
