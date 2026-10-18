import type { z } from "zod";
import type { CreatePropertySchema } from "@domly/shared";

export type CreatePropertyFormValues = z.input<typeof CreatePropertySchema>;

export const CREATE_PROPERTY_DEFAULTS = {
  dealType: "SALE" as const,
  category: "APARTMENT" as const,
  title: "",
  description: "",
  area: undefined,
  address: "",
  districtId: "",
  photos: [],
  latitude: undefined,
  longitude: undefined,
  price: undefined,
  pricePerNight: undefined,
  minStayNights: undefined,
  hasDeposit: false,
};