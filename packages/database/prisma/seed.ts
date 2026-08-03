import { randomUUID } from "crypto";
import {
  PrismaClient,
  Role,
  DealType,
  PropertyCategory,
  PropertyStatus,
  ModerationStatus,
  BookingStatus,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
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

async function clearDatabase(): Promise<void> {
  await prisma.favorite.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.property.deleteMany();
  await prisma.district.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers(): Promise<{ userIds: string[] }> {
  const passwordHash = await bcrypt.hash(FIXED_PASSWORD, 10);

  await prisma.user.createMany({
    data: [
      {
        email: "admin@domly.dev",
        passwordHash,
        role: "ADMIN",
        emailVerified: true,
      },
      {
        email: "realtor@domly.dev",
        passwordHash,
        role: "REALTOR",
        emailVerified: true,
      },
      {
        email: "developer@domly.dev",
        passwordHash,
        role: "DEVELOPER",
        emailVerified: true,
      },
      {
        email: "user@domly.dev",
        passwordHash,
        role: "USER",
        emailVerified: true,
      },
    ],
  });

  const randomUserCount = 116;
  const seenEmails = new Set<string>();
  const randomUsersData: {
    email: string;
    passwordHash: string;
    role: Role;
    emailVerified: boolean;
    isBlocked: boolean;
  }[] = [];

  while (randomUsersData.length < randomUserCount) {
    const email = faker.internet.email().toLowerCase();
    if (seenEmails.has(email)) continue;
    seenEmails.add(email);

    const role = weightedPick(ROLE_WEIGHTS);
    const isSelfServiceRole = role === "REALTOR" || role === "DEVELOPER";

    randomUsersData.push({
      email,
      passwordHash,
      role,
      emailVerified: isSelfServiceRole
        ? true
        : faker.datatype.boolean({ probability: 0.85 }),
      isBlocked: faker.datatype.boolean({ probability: 0.04 }),
    });
  }

  await prisma.user.createMany({ data: randomUsersData, skipDuplicates: true });

  const allUsers = await prisma.user.findMany({ select: { id: true } });
  return { userIds: allUsers.map((u) => u.id) };
}

type CityWithDistricts = {
  cityName: string;
  propertiesCount: number;
  lat: number;
  lng: number;
  districts: { id: string; name: string }[];
};

async function seedCitiesAndDistricts(): Promise<CityWithDistricts[]> {
  const result: CityWithDistricts[] = [];

  for (const cityDef of CITIES) {
    const city = await prisma.city.create({ data: { name: cityDef.name } });
    const districts = await Promise.all(
      cityDef.districts.map((name) =>
        prisma.district.create({ data: { name, cityId: city.id } }),
      ),
    );

    result.push({
      cityName: cityDef.name,
      propertiesCount: cityDef.propertiesCount,
      lat: cityDef.lat,
      lng: cityDef.lng,
      districts: districts.map((d) => ({ id: d.id, name: d.name })),
    });
  }

  return result;
}

type PropertySeedRow = {
  id: string;
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
      const id = randomUUID();

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
        dealType === "LONG_TERM_RENT"
          ? faker.datatype.boolean()
          : null;

      propertiesData.push({
        id,
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
        address: randomAddress(),
        latitude: jitterCoordinate(city.lat),
        longitude: jitterCoordinate(city.lng),
        photos: photosFor(id),
        viewsCount: faker.number.int({ min: 0, max: 480 }),
        ownerId: faker.helpers.arrayElement(ownerIds),
        districtId: district.id,
      });
    }
  }

  await prisma.property.createMany({ data: propertiesData });
  return propertiesData.map((p) => p.id);
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

async function main(): Promise<void> {
  console.log("Очищення бази даних...");
  await clearDatabase();

  console.log("Сідінг юзерів...");
  const { userIds } = await seedUsers();

  console.log("Сідінг міст та районів...");
  const cities = await seedCitiesAndDistricts();

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
    `  Юзерів: ${userIds.length} (+ 4 фіксовані: admin/realtor/developer/user@domly.dev, пароль "${FIXED_PASSWORD}")`,
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
