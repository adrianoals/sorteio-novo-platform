import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { defineConfig } from "drizzle-kit";

// Drizzle roda fora do Next: carrega a base e permite override local quando existir.
config({ path: resolve(process.cwd(), ".env") });
const envLocal = resolve(process.cwd(), ".env.local");
if (existsSync(envLocal)) {
  config({ path: envLocal, override: true });
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
