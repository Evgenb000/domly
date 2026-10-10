import { faker } from "@faker-js/faker";
import {
  BookingStatus,
  DealType,
  ModerationStatus,
  PrismaClient,
  PropertyCategory,
  PropertyStatus,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FIXED_PASSWORD = "Password123!";

const CITIES = [
  {
    name: "Київ",
    lat: 50.4501,
    lng: 30.5234,
    propertiesCount: 250,
    districts: [
      "Голосіївський",
      "Дарницький",
      "Деснянський",
      "Дніпровський",
      "Оболонський",
      "Печерський",
      "Подільський",
      "Святошинський",
      "Солом'янський",
      "Шевченківський",
    ],
  },
  {
    name: "Харків",
    lat: 49.9935,
    lng: 36.2304,
    propertiesCount: 150,
    districts: [
      "Індустріальний",
      "Київський",
      "Московський",
      "Немишлянський",
      "Новобаварський",
      "Основ'янський",
      "Слобідський",
      "Холодногірський",
      "Шевченківський",
    ],
  },
  {
    name: "Одеса",
    lat: 46.4825,
    lng: 30.7233,
    propertiesCount: 120,
    districts: ["Приморський", "Київський", "Малиновський", "Суворовський"],
  },
  {
    name: "Львів",
    lat: 49.8397,
    lng: 24.0297,
    propertiesCount: 80,
    districts: [
      "Галицький",
      "Залізничний",
      "Личаківський",
      "Сихівський",
      "Франківський",
      "Шевченківський",
    ],
  },
] as const;

const STREET_NAMES = [
  "Хрещатик",
  "Шевченка",
  "Івана Франка",
  "Лесі Українки",
  "Незалежності",
  "Європейська",
  "Січових Стрільців",
  "Грушевського",
  "Богдана Хмельницького",
  "Володимирська",
  "Пушкінська",
  "Дерибасівська",
  "Личаківська",
  "Городоцька",
  "Соборна",
  "Академіка Сахарова",
  "Антоновича",
];

const CATEGORY_LABELS: Record<PropertyCategory, string> = {
  APARTMENT: "Квартира",
  HOUSE: "Будинок",
  ROOM: "Кімната",
  GARAGE: "Гараж",
};

const CATEGORY_WEIGHTS: { value: PropertyCategory; weight: number }[] = [
  { value: "APARTMENT", weight: 60 },
  { value: "HOUSE", weight: 20 },
  { value: "ROOM", weight: 12 },
  { value: "GARAGE", weight: 8 },
];

const DEAL_TYPE_WEIGHTS: { value: DealType; weight: number }[] = [
  { value: "SALE", weight: 45 },
  { value: "LONG_TERM_RENT", weight: 40 },
  { value: "DAILY_RENT", weight: 15 },
];

const MODERATION_WEIGHTS: { value: ModerationStatus; weight: number }[] = [
  { value: "APPROVED", weight: 90 },
  { value: "REJECTED", weight: 10 },
];

const ROLE_WEIGHTS: { value: Role; weight: number }[] = [
  { value: "USER", weight: 75 },
  { value: "REALTOR", weight: 15 },
  { value: "DEVELOPER", weight: 10 },
];

const DESCRIPTION_FRAGMENTS = [
  "Світла та тепла нерухомість у тихому районі.",
  "Розвинена інфраструктура: школи, садочки, супермаркети поруч.",
  "Свіжий ремонт, встановлені нові вікна та двері.",
  "Зручне транспортне сполучення, поруч зупинки громадського транспорту.",
  "Власник, без комісії посередникам.",
  "Можливий торг при швидкому вирішенні питання.",
  "Тиха вулиця, паркування у дворі.",
  "Поруч парк та зелена зона для прогулянок.",
];

function weightedPick<T extends string>(
  items: { value: T; weight: number }[],
): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    if (roll < item.weight) return item.value;
    roll -= item.weight;
  }
  return items[items.length - 1].value;
}

function jitterCoordinate(base: number, spread = 0.06): number {
  return base + (Math.random() - 0.5) * spread;
}

function randomAddress(): string {
  const street = faker.helpers.arrayElement(STREET_NAMES);
  const building = faker.number.int({ min: 1, max: 140 });
  return `вул. ${street}, ${building}`;
}

function areaForCategory(category: PropertyCategory): number {
  switch (category) {
    case "APARTMENT":
      return faker.number.float({ min: 28, max: 120, fractionDigits: 1 });
    case "HOUSE":
      return faker.number.float({ min: 60, max: 320, fractionDigits: 1 });
    case "ROOM":
      return faker.number.float({ min: 10, max: 26, fractionDigits: 1 });
    case "GARAGE":
      return faker.number.float({ min: 15, max: 42, fractionDigits: 1 });
  }
}

function titleFor(
  category: PropertyCategory,
  area: number,
  districtName: string,
): string {
  return `${CATEGORY_LABELS[category]}, ${area} м², ${districtName} район`;
}

function randomDescription(): string {
  const sentences = faker.helpers.arrayElements(DESCRIPTION_FRAGMENTS, {
    min: 3,
    max: 5,
  });
  return sentences.join(" ");
}

function photosFor(seedKey: string): string[] {
  return Array.from(
    { length: 3 },
    (_, i) => `https://picsum.photos/seed/${seedKey}-${i}/900/650`,
  );
}

type CityWithDistricts = {
  cityName: string;
  propertiesCount: number;
  lat: number;
  lng: number;
  districts: { id: string; name: string }[];
};

const FIXED_USERS: { email: string; role: Role }[] = [
  { email: "admin@domly.dev", role: "ADMIN" },
  { email: "realtor@domly.dev", role: "REALTOR" },
  { email: "developer@domly.dev", role: "DEVELOPER" },
  { email: "user@domly.dev", role: "USER" },
];

async function seedUsers(): Promise<{ userIds: string[] }> {
  const passwordHash = await bcrypt.hash(FIXED_PASSWORD, 10);

  for (const user of FIXED_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        passwordHash,
        role: user.role,
        emailVerified: true,
      },
    });
  }

  const randomUserCount = 116;

  for (let i = 1; i <= randomUserCount; i++) {
    const email = `seed-user-${String(i).padStart(3, "0")}@seed.domly.dev`;
    const role = weightedPick(ROLE_WEIGHTS);
    const isSelfServiceRole = role === "REALTOR" || role === "DEVELOPER";

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        name: faker.person.fullName(),
        role,
        emailVerified: isSelfServiceRole
          ? true
          : faker.datatype.boolean({ probability: 0.85 }),
        isBlocked: faker.datatype.boolean({ probability: 0.04 }),
      },
    });
  }

  const seedOwnerEmails = [
    ...FIXED_USERS.map((u) => u.email),
    ...Array.from(
      { length: randomUserCount },
      (_, i) => `seed-user-${String(i + 1).padStart(3, "0")}@seed.domly.dev`,
    ),
  ];

  const seedUsers = await prisma.user.findMany({
    where: { email: { in: seedOwnerEmails } },
    select: { id: true },
  });

  return { userIds: seedUsers.map((u) => u.id) };
}

async function seedCitiesAndDistricts(): Promise<CityWithDistricts[]> {
  const result: CityWithDistricts[] = [];

  for (const cityDef of CITIES) {
    const city = await prisma.city.upsert({
      where: { name: cityDef.name },
      update: {},
      create: { name: cityDef.name },
    });

    const districts: { id: string; name: string }[] = [];
    for (const name of cityDef.districts) {
      const district = await prisma.district.upsert({
        where: { cityId_name: { cityId: city.id, name } },
        update: {},
        create: { name, cityId: city.id },
      });
      districts.push({ id: district.id, name: district.name });
    }

    result.push({
      cityName: cityDef.name,
      propertiesCount: cityDef.propertiesCount,
      lat: cityDef.lat,
      lng: cityDef.lng,
      districts,
    });
  }

  return result;
}

type PropertySeedRow = {
  title: string;
  description: string;
  category: PropertyCategory;
  dealType: DealType;
  status: PropertyStatus;
  moderationStatus: ModerationStatus;
  price: number | null;
  pricePerNight: number | null;
  minStayNights: number | null;
  hasDeposit: boolean | null;
  area: number;
  effectivePrice: number;
  address: string;
  latitude: number;
  longitude: number;
  photos: string[];
  viewsCount: number;
  ownerId: string;
  districtId: string;
};

async function seedProperties(
  cities: CityWithDistricts[],
  ownerIds: string[],
): Promise<string[]> {
  const propertiesData: PropertySeedRow[] = [];

  for (const city of cities) {
    for (let i = 0; i < city.propertiesCount; i++) {
      const district = faker.helpers.arrayElement(city.districts);
      const category = weightedPick(CATEGORY_WEIGHTS);
      const dealType = weightedPick(DEAL_TYPE_WEIGHTS);
      const area = areaForCategory(category);

      let price: number | null = null;
      let pricePerNight: number | null = null;
      let minStayNights: number | null = null;

      if (dealType === "SALE") {
        price = faker.number.int({ min: 500_000, max: 6_500_000 });
      } else if (dealType === "LONG_TERM_RENT") {
        price = faker.number.int({ min: 5_000, max: 45_000 });
      } else {
        pricePerNight = faker.number.int({ min: 600, max: 3_200 });
        minStayNights = faker.helpers.arrayElement([1, 2, 3]);
      }

      const hasDeposit =
        dealType === "LONG_TERM_RENT" ? faker.datatype.boolean() : null;

      const effectivePrice =
        dealType === "DAILY_RENT" ? pricePerNight! : price!;

      const photoSeed = `${city.cityName}-${district.name}-${i}`;

      propertiesData.push({
        title: titleFor(category, area, district.name),
        description: randomDescription(),
        category,
        dealType,
        status: "AVAILABLE",
        moderationStatus: weightedPick(MODERATION_WEIGHTS),
        price,
        pricePerNight,
        minStayNights,
        hasDeposit,
        area,
        effectivePrice,
        address: randomAddress(),
        latitude: jitterCoordinate(city.lat),
        longitude: jitterCoordinate(city.lng),
        photos: photosFor(photoSeed),
        viewsCount: faker.number.int({ min: 0, max: 480 }),
        ownerId: faker.helpers.arrayElement(ownerIds),
        districtId: district.id,
      });
    }
  }

  await prisma.property.createMany({ data: propertiesData });
  const created = await prisma.property.findMany({
    where: { ownerId: { in: ownerIds } },
    select: { id: true },
  });
  return created.map((p) => p.id);
}

async function seedBookings(
  propertyIds: string[],
  userIds: string[],
): Promise<void> {
  const shuffled = faker.helpers.shuffle([...propertyIds]);

  const reservedCount = 60;
  const historicalCount = 40;

  const reservedIds = shuffled.slice(0, reservedCount);
  const historicalIds = shuffled.slice(
    reservedCount,
    reservedCount + historicalCount,
  );

  await prisma.$transaction(
    reservedIds.map((propertyId) =>
      prisma.property.update({
        where: { id: propertyId },
        data: { status: "RESERVED" },
      }),
    ),
  );

  await prisma.booking.createMany({
    data: reservedIds.map((propertyId) => ({
      propertyId,
      userId: faker.helpers.arrayElement(userIds),
      status: "ACTIVE" as BookingStatus,
    })),
  });

  await prisma.booking.createMany({
    data: historicalIds.map((propertyId) => ({
      propertyId,
      userId: faker.helpers.arrayElement(userIds),
      status: faker.helpers.arrayElement<BookingStatus>([
        "CANCELLED",
        "EXPIRED",
      ]),
    })),
  });
}

async function seedFavorites(
  propertyIds: string[],
  userIds: string[],
): Promise<void> {
  const favoritesData: { userId: string; propertyId: string }[] = [];
  const seenPairs = new Set<string>();

  const targetCount = 320;
  let attempts = 0;

  while (favoritesData.length < targetCount && attempts < targetCount * 5) {
    attempts++;
    const userId = faker.helpers.arrayElement(userIds);
    const propertyId = faker.helpers.arrayElement(propertyIds);
    const key = `${userId}:${propertyId}`;

    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    favoritesData.push({ userId, propertyId });
  }

  await prisma.favorite.createMany({
    data: favoritesData,
    skipDuplicates: true,
  });
}

async function deleteSeedProperties(): Promise<void> {
  const deleted = await prisma.property.deleteMany({
    where: {
      OR: [
        { owner: { email: { endsWith: "@domly.dev" } } },
        { owner: { email: { endsWith: "@seed.domly.dev" } } },
      ],
    },
  });
  console.log(`Видалено попередніх сід-об'яв: ${deleted.count}`);
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed is not allowed when NODE_ENV=production");
  }

  console.log("Сідінг юзерів...");
  const { userIds } = await seedUsers();

  console.log("Сідінг міст та районів...");
  const cities = await seedCitiesAndDistricts();

  await deleteSeedProperties();

  console.log("Сідінг об'яв...");
  const propertyIds = await seedProperties(cities, userIds);

  console.log("Сідінг бронювань...");
  await seedBookings(propertyIds, userIds);

  console.log("Сідінг обраного...");
  await seedFavorites(propertyIds, userIds);

  console.log("");
  console.log("Готово:");
  console.log(`  Міст: ${cities.length}`);
  console.log(
    `  Районів: ${cities.reduce((sum, c) => sum + c.districts.length, 0)}`,
  );
  console.log(
    `  Юзерів: ${userIds.length} (фіксовані: admin/realtor/developer/user@domly.dev + seed-user-NNN@seed.domly.dev, пароль "${FIXED_PASSWORD}")`,
  );
  console.log(`  Об'яв: ${propertyIds.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
