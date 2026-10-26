import type { z } from "zod";
import type { CreatePropertySchema } from "@domly/shared";
import type { Property } from "./types";

export type PropertyFormValues = z.input<typeof CreatePropertySchema>;

export function toFormValues(property: Property): PropertyFormValues | null {
  const common = {
    category: property.category,
    title: property.title,
    description: property.description,
    area: property.area,
    address: property.address ?? undefined,
    latitude: property.latitude,
    longitude: property.longitude,
    photos: [...property.photos],
    districtId: property.districtId,
  };

  switch (property.dealType) {
    case "SALE":
      if (property.price === null) return null;
      return { ...common, dealType: "SALE", price: property.price };
    case "LONG_TERM_RENT":
      if (property.price === null) return null;
      return {
        ...common,
        dealType: "LONG_TERM_RENT",
        price: property.price,
        hasDeposit: property.hasDeposit ?? false,
      };
    case "DAILY_RENT":
      if (property.pricePerNight === null || property.minStayNights === null) return null;
      return {
        ...common,
        dealType: "DAILY_RENT",
        pricePerNight: property.pricePerNight,
        minStayNights: property.minStayNights,
      };
  }
}
