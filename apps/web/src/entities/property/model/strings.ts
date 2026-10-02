export const PROPERTY_GALLERY_STRINGS = {
  empty: "Фото відсутствуют",
  thumbnailLabel: (index: number) => `Превью фото ${index + 1}`,
};

export const PROPERTY_DETAILS_STRINGS = {
  metaTitle: "Характеристики",
  descriptionTitle: "Описание",
  priceLabel: "Цена",
  areaLabel: "Площа",
  locationLabel: "Локація",
  addressLabel: "Адрес",
  minStayLabel: "Мінімальний срок проживання",
  viewsLabel: "Проєоглянуто",
  areaFormat: (value: number) => `${value} м²`,
  locationFormat: (district: string, city: string) => `${district}, ${city}`,
  minStayFormat: (nights: number) => `${nights} ніч`,
  viewsFormat: (count: number) => `${count} раз`,
};