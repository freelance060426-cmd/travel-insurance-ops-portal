import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service";
import type { LoginDto } from "./dto/login.dto";

const bcrypt = require("bcryptjs") as {
  compare: (plain: string, hashed: string) => Promise<boolean>;
  hash: (plain: string, rounds: number) => Promise<string>;
};

const jwt = require("jsonwebtoken") as {
  sign: (
    payload: Record<string, unknown>,
    secret: string,
    options: { expiresIn: string },
  ) => string;
  verify: (token: string, secret: string) => unknown;
};

type AuthTokenPayload = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private getJwtSecret() {
    return process.env.JWT_SECRET || "change-me";
  }

  private getDefaultAdminEmail() {
    return process.env.DEFAULT_ADMIN_EMAIL || "admin@travel-ops.local";
  }

  private getDefaultAdminPassword() {
    return process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
  }

  async ensureDefaultAdmin() {
    const email = this.getDefaultAdminEmail();
    const password = this.getDefaultAdminPassword();
    const passwordHash = await bcrypt.hash(password, 10);

    return this.prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        name: "Default Admin",
        role: "SUPER_ADMIN",
      },
      create: {
        email,
        passwordHash,
        name: "Default Admin",
        role: "SUPER_ADMIN",
      },
    });
  }

  async login(input: LoginDto) {
    await this.ensureDefaultAdmin();

    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, this.getJwtSecret(), {
      expiresIn: "1d",
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };
  }

  verifyToken(token: string) {
    return jwt.verify(token, this.getJwtSecret()) as AuthTokenPayload;
  }
}
