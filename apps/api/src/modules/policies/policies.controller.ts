import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { existsSync, mkdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import { policyUploadsRoot } from "../../common/runtime-paths";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PoliciesService } from "./policies.service";
import type { CreatePolicyDto } from "./dto/create-policy.dto";
import type { EndorsePolicyDto } from "./dto/endorse-policy.dto";
import type { SendPolicyEmailDto } from "./dto/send-policy-email.dto";

type ReqUser = { sub: string; email: string; role: string; partnerId: string | null };

if (!existsSync(policyUploadsRoot)) {
  mkdirSync(policyUploadsRoot, { recursive: true });
}

const allowedDocumentMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

@Controller("policies")
@UseGuards(JwtAuthGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) { }

  @Get()
  listPolicies(
    @Query() query: Record<string, string | undefined>,
    @Req() request: { user?: ReqUser },
  ) {
    const user = request.user!;
    const scoped = user.role === "PARTNER" && user.partnerId
      ? { ...query, partnerId: user.partnerId }
      : query;
    return this.policiesService.list(scoped);
  }

  @Get("check-passport")
  checkPassport(@Query("passport") passport: string) {
    return this.policiesService.checkPassport(passport);
  }

  @Get(":id")
  async getPolicy(@Param("id") id: string, @Req() request: { user?: ReqUser }) {
    const policy = await this.policiesService.getById(id);
    const user = request.user!;
    if (user.role === "PARTNER" && user.partnerId && policy.partnerId !== user.partnerId) {
      throw new ForbiddenException("Access denied");
    }
    return policy;
  }

  @Post()
  createPolicy(@Body() body: CreatePolicyDto, @Req() request: { user?: ReqUser }) {
    const user = request.user!;
    const payload = user.role === "PARTNER" && user.partnerId
      ? { ...body, partnerId: user.partnerId }
      : body;
    return this.policiesService.create(payload);
  }

  @Patch(":id/endorse")
  async endorsePolicy(
    @Param("id") id: string,
    @Body() body: EndorsePolicyDto,
    @Req() request: { user?: ReqUser },
  ) {
    const user = request.user!;
    if (user.role === "PARTNER" && user.partnerId) {
      const policy = await this.policiesService.getById(id);
      if (policy.partnerId !== user.partnerId) {
        throw new ForbiddenException("Access denied");
      }
    }
    return this.policiesService.endorse(id, body);
  }

  @Post(":id/documents")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (
        _req: unknown,
        file: { mimetype: string },
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (!allowedDocumentMimeTypes.has(file.mimetype)) {
          cb(
            new BadRequestException(
              "Only PDF, JPEG, PNG, and WebP documents are allowed",
            ),
            false,
          );
          return;
        }

        cb(null, true);
      },
      storage: diskStorage({
        destination: (
          _req: unknown,
          _file: { originalname: string },
          cb: (error: Error | null, destination: string) => void,
        ) => cb(null, policyUploadsRoot),
        filename: (
          _req: unknown,
          file: { originalname: string },
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadDocument(
    @Param("id") id: string,
    @UploadedFile()
    file: { originalname: string; mimetype: string; filename: string },
    @Req() request: { user?: { email?: string } },
  ) {
    return this.policiesService.addDocument(id, file, request.user?.email || null);
  }

  @Get(":id/pdf")
  getOrGeneratePdf(@Param("id") id: string) {
    return this.policiesService.getOrGeneratePdf(id);
  }

  @Post(":id/pdf/regenerate")
  regeneratePdf(@Param("id") id: string) {
    return this.policiesService.getOrGeneratePdf(id, true);
  }

  @Post(":id/email")
  sendPolicyEmail(
    @Param("id") id: string,
    @Body() body: SendPolicyEmailDto,
    @Req() request: { user?: { email?: string } },
  ) {
    return this.policiesService.sendPolicyEmail(
      id,
      body,
      request.user?.email || null,
    );
  }
}
