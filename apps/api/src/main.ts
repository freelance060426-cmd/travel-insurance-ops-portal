import { config as loadEnv } from "dotenv";
import { existsSync, mkdirSync } from "node:fs";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { resolve } from "node:path";
import { AppModule } from "./app.module";

async function bootstrap() {
  loadEnv({ path: resolve(process.cwd(), "../../.env") });
  loadEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api");
  const uploadsPath = resolve(process.cwd(), "../../uploads");
  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }
  app.enableCors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  });
  app.useStaticAssets(uploadsPath, {
    prefix: "/uploads/",
  });

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
}

void bootstrap();
