import { Body, Controller, Post } from "@nestjs/common";

@Controller("auth")
export class AuthController {
  @Post("login")
  login(@Body() body: { email?: string }) {
    return {
      ok: true,
      message: "Auth module skeleton ready",
      email: body.email ?? null,
    };
  }
}
