import Image from "next/image";
import Link from "next/link";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import type { Property } from "../model/types";
import { getPriceLabel } from "../model/priceLabel";
import { formatPrice } from "../model/format";
import { DEAL_TYPE_LABELS } from "../model/labels";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const price = getPriceLabel(property);

  return (
    <Card className="overflow-hidden border-border bg-card p-4">
      <Link
        href={`/properties/${property.id}`}
        className="flex flex-col gap-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-secondary">
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
            {DEAL_TYPE_LABELS[property.dealType]}
          </Badge>
        </div>

        <div>
          <p className="mb-1 truncate text-[15px] font-medium text-foreground">
            {property.title}
          </p>

          <p className="mb-3 text-[13px] text-muted-foreground">
            {property.area} м² · {property.districtName}, {property.cityName}
          </p>

          <div className="flex items-baseline gap-1">
            <span className="whitespace-nowrap text-[16px] font-medium text-primary">
              {formatPrice(price.amount)}
            </span>
            {price.suffix ? (
              <span className="whitespace-nowrap text-[13px] text-muted-foreground">
                {price.suffix}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </Card>
  );
}
