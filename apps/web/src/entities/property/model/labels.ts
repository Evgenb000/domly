export const DEAL_TYPE_LABELS: Record<
  "SALE" | "LONG_TERM_RENT" | "DAILY_RENT",
  string
> = {
  SALE: "Продаж",
  LONG_TERM_RENT: "Довгострокова оренда",
  DAILY_RENT: "Подобова оренда",
};

export const PROPERTY_CATEGORY_LABELS: Record<
  "APARTMENT" | "HOUSE" | "ROOM" | "GARAGE",
  string
> = {
  APARTMENT: "Квартира",
  HOUSE: "Будинок",
  ROOM: "Кімната",
  GARAGE: "Гараж",
};

export const PROPERTY_STATUS_LABELS: Record<"AVAILABLE" | "RESERVED", string> = {
  AVAILABLE: "Доступно",
  RESERVED: "Заброньовано",
};

export const OWNER_ROLE_LABELS: Record<"USER" | "REALTOR" | "DEVELOPER" | "ADMIN", string> = {
  USER: "Користувач",
  REALTOR: "Ріелтор",
  DEVELOPER: "Забудовник",
  ADMIN: "Адмін",
};