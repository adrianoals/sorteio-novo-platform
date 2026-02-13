import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const isProduction = process.env.NODE_ENV === "production";
const configuredPoolMax = Number(process.env.DB_POOL_MAX ?? "");
const poolMax = Number.isFinite(configuredPoolMax) && configuredPoolMax > 0
  ? configuredPoolMax
  : isProduction
    ? 5
    : 10;

const client = postgres(connectionString, {
  max: poolMax,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});

export const db = drizzle(client, { schema });
