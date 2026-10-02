import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import type { Property } from "../model/types";
import { getPriceLabel } from "../model/priceLabel";
import { formatPrice } from "../model/format";
import {
  DEAL_TYPE_LABELS,
  PROPERTY_CATEGORY_LABELS,
  PROPERTY_STATUS_LABELS,
  OWNER_ROLE_LABELS,
} from "../model/labels";
import { PROPERTY_DETAILS_STRINGS } from "../model/strings";

interface PropertyDetailsInfoProps {
  property: Property;
}

export function PropertyDetailsInfo({ property }: PropertyDetailsInfoProps) {
  const price = getPriceLabel(property);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{DEAL_TYPE_LABELS[property.dealType]}</Badge>
        <Badge variant="outline">{PROPERTY_CATEGORY_LABELS[property.category]}</Badge>
        {property.ownerRole === "REALTOR" || property.ownerRole === "DEVELOPER" ? (
          <Badge variant="secondary">{OWNER_ROLE_LABELS[property.ownerRole]}</Badge>
        ) : null}
        {property.status === "RESERVED" ? (
          <Badge variant="destructive">{PROPERTY_STATUS_LABELS[property.status]}</Badge>
        ) : null}
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>{PROPERTY_DETAILS_STRINGS.metaTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-muted-foreground">{PROPERTY_DETAILS_STRINGS.priceLabel}</span>
            <span className="text-foreground">
              {formatPrice(price.amount)}
              {price.suffix ? ` ${price.suffix}` : ""}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-muted-foreground">{PROPERTY_DETAILS_STRINGS.areaLabel}</span>
            <span className="text-foreground">{PROPERTY_DETAILS_STRINGS.areaFormat(property.area)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-muted-foreground">{PROPERTY_DETAILS_STRINGS.locationLabel}</span>
            <span className="text-foreground">
              {PROPERTY_DETAILS_STRINGS.locationFormat(property.districtName, property.cityName)}
            </span>
          </div>
          {property.address ? (
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-muted-foreground">{PROPERTY_DETAILS_STRINGS.addressLabel}</span>
              <span className="text-right text-foreground">{property.address}</span>
            </div>
          ) : null}
          {property.minStayNights !== null ? (
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-muted-foreground">{PROPERTY_DETAILS_STRINGS.minStayLabel}</span>
              <span className="text-foreground">
                {PROPERTY_DETAILS_STRINGS.minStayFormat(property.minStayNights)}
              </span>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-muted-foreground">{PROPERTY_DETAILS_STRINGS.viewsLabel}</span>
            <span className="text-foreground">{PROPERTY_DETAILS_STRINGS.viewsFormat(property.viewsCount)}</span>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>{PROPERTY_DETAILS_STRINGS.descriptionTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-foreground">{property.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}