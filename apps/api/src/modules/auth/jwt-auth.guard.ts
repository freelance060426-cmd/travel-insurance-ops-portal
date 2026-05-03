import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";

type RequestWithUser = {
  headers: {
    authorization?: string;
  };
  user?: {
    sub: string;
    email: string;
    role: string;
    partnerId: string | null;
  };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authHeader.replace("Bearer ", "").trim();
    request.user = await this.authService.verifyActiveToken(token);
    return true;
  }
}
