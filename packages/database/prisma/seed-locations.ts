import { PrismaClient } from "@prisma/client";
import { CITIES } from "./locations.data";

const prisma = new PrismaClient();

async function seedLocations(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const parsed = new URL(databaseUrl);
  console.log(`Підключення до БД: ${parsed.hostname}`);

  for (const cityDef of CITIES) {
    const city = await prisma.city.upsert({
      where: { name: cityDef.name },
      update: {},
      create: { name: cityDef.name },
    });

    for (const name of cityDef.districts) {
      await prisma.district.upsert({
        where: { cityId_name: { cityId: city.id, name } },
        update: {},
        create: { name, cityId: city.id },
      });
    }
  }

  const citiesCount = await prisma.city.count();
  const districtsCount = await prisma.district.count();

  console.log("");
  console.log("Готово:");
  console.log(`  Міст: ${citiesCount}`);
  console.log(`  Районів: ${districtsCount}`);
}

seedLocations()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
