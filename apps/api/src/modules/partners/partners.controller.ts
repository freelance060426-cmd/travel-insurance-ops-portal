import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { PartnersService } from "./partners.service";
import type { CreatePartnerDto } from "./dto/create-partner.dto";

@Controller("partners")
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
  createPartner(@Body() body: CreatePartnerDto) {
    return this.partnersService.create(body);
  }
}
