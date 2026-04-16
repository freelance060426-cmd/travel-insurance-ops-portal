import { config as loadEnv } from "dotenv";
import { NestFactory } from "@nestjs/core";
import { resolve } from "node:path";
import { AppModule } from "./app.module";

async function bootstrap() {
  loadEnv({ path: resolve(process.cwd(), "../../.env") });
  loadEnv();

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
}

void bootstrap();
