import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { PoliciesService } from "./policies.service";
import type { CreatePolicyDto } from "./dto/create-policy.dto";

@Controller("policies")
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  listPolicies() {
    return this.policiesService.list();
  }

  @Get(":id")
  getPolicy(@Param("id") id: string) {
    return this.policiesService.getById(id);
  }

  @Post()
  createPolicy(@Body() body: CreatePolicyDto) {
    return this.policiesService.create(body);
  }
}
