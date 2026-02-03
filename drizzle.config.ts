import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { defineConfig } from "drizzle-kit";

// Next usa .env.local por padrão; Drizzle roda fora do Next, então carregamos aqui
const envLocal = resolve(process.cwd(), ".env.local");
if (existsSync(envLocal)) {
  config({ path: envLocal });
} else {
  config();
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
