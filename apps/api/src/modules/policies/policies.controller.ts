import {
  BadRequestException,
  Body,
  Controller,
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
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  listPolicies(@Query() query: Record<string, string | undefined>) {
    return this.policiesService.list(query);
  }

  @Get(":id")
  getPolicy(@Param("id") id: string) {
    return this.policiesService.getById(id);
  }

  @Post()
  createPolicy(@Body() body: CreatePolicyDto) {
    return this.policiesService.create(body);
  }

  @Patch(":id/endorse")
  endorsePolicy(@Param("id") id: string, @Body() body: EndorsePolicyDto) {
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
