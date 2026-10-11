import {
  DealType,
  ModerationStatus,
  PrismaClient,
  PropertyCategory,
  PropertyStatus,
} from "@prisma/client";
import { CITIES } from "./locations.data";

const prisma = new PrismaClient();

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  Київ: { lat: 50.4501, lng: 30.5234 },
  Харків: { lat: 49.9935, lng: 36.2304 },
  Одеса: { lat: 46.4825, lng: 30.7233 },
  Львів: { lat: 49.8397, lng: 24.0297 },
};

interface DemoListing {
  title: string;
  description: string;
  category: PropertyCategory;
  dealType: DealType;
  price?: number;
  pricePerNight?: number;
  minStayNights?: number;
  hasDeposit?: boolean;
  area: number;
  address: string;
  cityName: string;
  districtName: string;
}

const DEMO_LISTINGS: DemoListing[] = [
  {
    title: "Світла двокімнатна квартира в центрі Києва",
    description:
      "Світла двокімнатна квартира з панорамними вікнами у тихому дворі Печерського району. Євроремонт, повністю укомплектована кухня та вмонтовані шафи. Поруч метро, парк та шкільні заклади.",
    category: PropertyCategory.APARTMENT,
    dealType: DealType.SALE,
    price: 8500000,
    area: 68,
    address: "вул. Грушевського, 12",
    cityName: "Київ",
    districtName: "Печерський",
  },
  {
    title: "Затишний будинок з садом у Львові",
    description:
      "Двоповерховий будинок із власною ділянкою та зеленим садом у Галицькому районі Львова. Автономне опалення, гараж на дві машини та затишний палісадник. Ідеально для сімейного проживання.",
    category: PropertyCategory.HOUSE,
    dealType: DealType.SALE,
    price: 6200000,
    area: 140,
    address: "вул. Личаківська, 45",
    cityName: "Львів",
    districtName: "Галицький",
  },
  {
    title: "Гараж біля станції метро у Харкові",
    description:
      "Капітальний гараж із витяжною вентиляцією та оглядовою ямою у Київському районі Харкова. Поруч зручна транспортна розв'язка та охороняється територія. Підходить для зберігання авто і інструментів.",
    category: PropertyCategory.GARAGE,
    dealType: DealType.SALE,
    price: 350000,
    area: 24,
    address: "вул. Полтавський Шлях, 8",
    cityName: "Харків",
    districtName: "Київський",
  },
  {
    title: "Сучасна квартира в оренду на Подолі",
    description:
      "Стильна однокімнатна квартира з дизайнерським ремонтом у Подільському районі Києва. Велика кухня-студія, пральна машина та швидкісний інтернет. Поруч набережна, ресторани та бізнес-центри.",
    category: PropertyCategory.APARTMENT,
    dealType: DealType.LONG_TERM_RENT,
    price: 14000,
    hasDeposit: true,
    area: 52,
    address: "вул. Костянтинівська, 21",
    cityName: "Київ",
    districtName: "Подільський",
  },
  {
    title: "Кімната для оренди у центрі Одеси",
    description:
      "Затишна кімната з усіма зручностями у Приморському районі Одеси. Спільна чиста кухня та сучасна сантехніка, меблі та побутова техніка включені. Піша доступність до моря та ринку.",
    category: PropertyCategory.ROOM,
    dealType: DealType.LONG_TERM_RENT,
    price: 6500,
    hasDeposit: false,
    area: 18,
    address: "вул. Катерининська, 33",
    cityName: "Одеса",
    districtName: "Приморський",
  },
  {
    title: "Апартаменти подобово у центрі Львова",
    description:
      "Комфортабельні апартаменти з дизайнерським інтер'єром у Франківському районі Львова. Телевізор, кондиціонер та безкоштовний швидкісний Wi-Fi. За кілька кроків від площі Ринок та кав'ярні старого міста.",
    category: PropertyCategory.APARTMENT,
    dealType: DealType.DAILY_RENT,
    pricePerNight: 1200,
    minStayNights: 2,
    area: 45,
    address: "вул. Городоцька, 120",
    cityName: "Львів",
    districtName: "Франківський",
  },
  {
    title: "Будинок подобово у Дарниці",
    description:
      "Просторий будинок для відпочинку компанією у Дарницькому районі Києва. Великий двір із зоною барбекю, мангал та парковка на кілька машин. Затишок за містом і швидкий доїзд до центру.",
    category: PropertyCategory.HOUSE,
    dealType: DealType.DAILY_RENT,
    pricePerNight: 2500,
    minStayNights: 3,
    area: 110,
    address: "Броварський просп., 5",
    cityName: "Київ",
    districtName: "Дарницький",
  },
  {
    title: "Кімната подобово біля моря в Одесі",
    description:
      "Кімната для короткострокового відпочинку у Малиновському районі Одеси. Сучасні меблі, кондиціонер та чиста постільна білизна. Поруч зручний транспорт до пляжу та розваг.",
    category: PropertyCategory.ROOM,
    dealType: DealType.DAILY_RENT,
    pricePerNight: 700,
    minStayNights: 1,
    area: 16,
    address: "вул. Генуезька, 9",
    cityName: "Одеса",
    districtName: "Малиновський",
  },
];

function coordinateOffset(index: number): number {
  return ((index % 5) - 2) * 0.005;
}

function buildPhotos(index: number): string[] {
  return [1, 2, 3].map(
    (photoNumber) =>
      `https://picsum.photos/seed/domly-${index + 1}-${photoNumber}/1200/800`,
  );
}

function resolveEffectivePrice(listing: DemoListing): number {
  if (listing.dealType === DealType.DAILY_RENT) {
    if (listing.pricePerNight === undefined) {
      throw new Error(
        `pricePerNight is required for DAILY_RENT: ${listing.title}`,
      );
    }
    return listing.pricePerNight;
  }
  if (listing.price === undefined) {
    throw new Error(
      `price is required for ${listing.dealType}: ${listing.title}`,
    );
  }
  return listing.price;
}

async function findDistrict(cityName: string, districtName: string) {
  const cityExists = CITIES.some((city) => city.name === cityName);
  if (!cityExists) {
    throw new Error(`City not found in CITIES: ${cityName}`);
  }

  const district = await prisma.district.findFirst({
    where: { name: districtName, city: { name: cityName } },
  });
  if (!district) {
    throw new Error(
      `District "${districtName}" for city "${cityName}" not found in database`,
    );
  }
  return district;
}

async function seedDemoListings(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  console.log(`Підключення до БД: ${new URL(databaseUrl).host}`);

  const ownerEmail = process.env.DEMO_OWNER_EMAIL;
  if (!ownerEmail) {
    throw new Error("DEMO_OWNER_EMAIL is not set");
  }

  const owner = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });
  if (!owner) {
    throw new Error(
      `Owner user not found for DEMO_OWNER_EMAIL: ${ownerEmail}`,
    );
  }

  let created = 0;
  let skipped = 0;

  for (const [index, listing] of DEMO_LISTINGS.entries()) {
    const existing = await prisma.property.findFirst({
      where: { ownerId: owner.id, title: listing.title },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const district = await findDistrict(
      listing.cityName,
      listing.districtName,
    );
    const center = CITY_CENTERS[listing.cityName];
    const latitude = center.lat + coordinateOffset(index);
    const longitude = center.lng + coordinateOffset(index + 1);

    await prisma.property.create({
      data: {
        title: listing.title,
        description: listing.description,
        category: listing.category,
        dealType: listing.dealType,
        status: PropertyStatus.AVAILABLE,
        moderationStatus: ModerationStatus.APPROVED,
        price: listing.dealType === DealType.DAILY_RENT ? null : listing.price,
        pricePerNight:
          listing.dealType === DealType.DAILY_RENT
            ? listing.pricePerNight
            : null,
        minStayNights:
          listing.dealType === DealType.DAILY_RENT
            ? listing.minStayNights
            : null,
        hasDeposit:
          listing.dealType === DealType.LONG_TERM_RENT
            ? (listing.hasDeposit ?? null)
            : null,
        area: listing.area,
        effectivePrice: resolveEffectivePrice(listing),
        address: listing.address,
        latitude,
        longitude,
        photos: buildPhotos(index),
        viewsCount: 0,
        ownerId: owner.id,
        districtId: district.id,
      },
    });

    created += 1;
  }

  console.log("");
  console.log("Готово:");
  console.log(`  Створено: ${created}`);
  console.log(`  Пропущено: ${skipped}`);
}

seedDemoListings()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

