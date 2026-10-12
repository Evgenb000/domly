export const PROPERTY_GALLERY_STRINGS = {
  empty: "Фото відсутні",
  thumbnailLabel: (index: number) => `Мініатюра фото ${index + 1}`,
};

export const PROPERTY_DETAILS_STRINGS = {
  metaTitle: "Характеристики",
  descriptionTitle: "Опис",
  priceLabel: "Ціна",
  areaLabel: "Площа",
  locationLabel: "Локація",
  addressLabel: "Адреса",
  minStayLabel: "Мінімальний термін проживання",
  viewsLabel: "Переглянуто",
  areaFormat: (value: number) => `${value} м²`,
  locationFormat: (district: string, city: string) => `${district}, ${city}`,
  minStayFormat: (nights: number) => `${nights} ніч`,
  viewsFormat: (count: number) => `${count} раз`,
};