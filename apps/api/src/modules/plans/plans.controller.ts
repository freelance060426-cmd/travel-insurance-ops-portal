import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PlansService } from "./plans.service";

@Controller("plans")
@UseGuards(JwtAuthGuard)
export class PlansController {
    constructor(private readonly plansService: PlansService) { }

    @Get()
    listPlans(@Query() query: Record<string, string | undefined>) {
        return this.plansService.list(query);
    }
}
