import { Body, Controller, Get, Req, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() request: { user?: { sub: string } }) {
    return this.authService.getProfile(request.user!.sub);
  }

  @Post("users")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  createUser(
    @Body()
    body: {
      email: string;
      password: string;
      name: string;
      role: "SUPER_ADMIN" | "PARTNER";
      partnerId?: string | null;
    },
  ) {
    return this.authService.createUser(body);
  }

  @Get("users")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  listUsers() {
    return this.authService.listUsers();
  }
}
