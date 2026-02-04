import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import bcrypt from "bcrypt";

// Carregar .env.local ANTES de qualquer import que use DATABASE_URL (imports estáticos rodam primeiro)
const envLocal = resolve(process.cwd(), ".env.local");
if (existsSync(envLocal)) {
  config({ path: envLocal });
} else {
  config();
}

async function seed() {
  const { db } = await import("./index");
  const { users } = await import("./schema/users");
  const { tenants } = await import("./schema/tenants");
  const { apartments } = await import("./schema/apartments");
  const { parkingSpots } = await import("./schema/parking_spots");

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@sorteionovo.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await db
    .insert(users)
    .values({
      email: adminEmail,
      passwordHash,
      role: "admin",
    })
    .onConflictDoNothing({ target: [users.email] });
  console.log(`Admin user: ${adminEmail} (senha: ${adminPassword})`);

  const { eq } = await import("drizzle-orm");
  const existing = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, "condominio-teste")).limit(1);
  let tenantId: string;
  let created = false;
  if (existing[0]) {
    tenantId = existing[0].id;
  } else {
    const [inserted] = await db
      .insert(tenants)
      .values({
        name: "Condomínio Teste",
        slug: "condominio-teste",
        status: "active",
        config: {
          has_blocks: false,
          has_basement: true,
          basements: ["Subsolo 1", "Subsolo 2"],
          enabled_features: { pne: false, idoso: false },
          intended_draw_type: "S1",
        },
      })
      .returning({ id: tenants.id });
    if (!inserted) {
      console.error("Failed to create tenant");
      process.exit(1);
    }
    tenantId = inserted.id;
    created = true;
  }

  if (created) {
    await db.insert(apartments).values([
      { tenantId, number: "101", rights: ["simple"] },
      { tenantId, number: "102", rights: ["simple"] },
      { tenantId, number: "201", rights: ["double"] },
    ]);
    await db.insert(parkingSpots).values([
      { tenantId, number: "Vaga 01", basement: "Subsolo 1", spotType: "simple" },
      { tenantId, number: "Vaga 02", basement: "Subsolo 1", spotType: "simple" },
      { tenantId, number: "Vaga 03", basement: "Subsolo 1", spotType: "double" },
    ]);
  }

  console.log("Seed completed: admin user, 1 tenant, 3 apartments, 3 parking spots.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
