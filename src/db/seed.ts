import "dotenv/config";
import { db } from "./index";
import { tenants } from "./schema/tenants";
import { apartments } from "./schema/apartments";
import { parkingSpots } from "./schema/parking_spots";

async function seed() {
  const [tenant] = await db
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

  if (!tenant) {
    console.error("Failed to create tenant");
    process.exit(1);
  }

  await db.insert(apartments).values([
    { tenantId: tenant.id, number: "101", rights: "simple" },
    { tenantId: tenant.id, number: "102", rights: "simple" },
    { tenantId: tenant.id, number: "201", rights: "double" },
  ]);

  await db.insert(parkingSpots).values([
    { tenantId: tenant.id, number: "Vaga 01", basement: "Subsolo 1", spotType: "simple" },
    { tenantId: tenant.id, number: "Vaga 02", basement: "Subsolo 1", spotType: "simple" },
    { tenantId: tenant.id, number: "Vaga 03", basement: "Subsolo 1", spotType: "double" },
  ]);

  console.log("Seed completed: 1 tenant, 3 apartments, 3 parking spots.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
