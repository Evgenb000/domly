import Image from "next/image";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import type { Property } from "../model/types";
import { getPriceLabel } from "../model/priceLabel";

const dealTypeLabel: Record<Property["dealType"], string> = {
  SALE: "Продаж",
  LONG_TERM_RENT: "Довгострокова оренда",
  DAILY_RENT: "Подобова оренда",
};

const currencyFormatter = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  maximumFractionDigits: 0,
});

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const price = getPriceLabel(property);

  return (
    <Card className="overflow-hidden border-border bg-card p-4">
      <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-lg bg-secondary">
        {property.photos[0] ? (
          <Image
            src={property.photos[0]}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : null}
        <Badge
          variant="outline"
          className="absolute left-2 top-2 border-primary/40 bg-background/80 text-primary backdrop-blur-sm"
        >
          {dealTypeLabel[property.dealType]}
        </Badge>
      </div>

      <p className="mb-1 truncate text-[15px] font-medium text-foreground">
        {property.title}
      </p>

      <p className="mb-3 text-[13px] text-muted-foreground">
        {property.area} м² · {property.districtName}, {property.cityName}
      </p>

      <div className="flex items-baseline gap-1">
        <span className="whitespace-nowrap text-[16px] font-medium text-primary">
          {currencyFormatter.format(price.amount)}
        </span>
        {price.suffix ? (
          <span className="whitespace-nowrap text-[13px] text-muted-foreground">
            {price.suffix}
          </span>
        ) : null}
      </div>
    </Card>
  );
}