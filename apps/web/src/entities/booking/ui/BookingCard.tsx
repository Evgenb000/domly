import type { ReactNode } from "react";
import { PropertyCard } from "@/entities/property";
import { Badge } from "@/shared/ui/badge";
import type { Booking } from "../model/types";
import { BOOKING_STATUS_LABELS } from "../model/labels";
import { getBookingExpiresAt } from "../model/expiry";
import { BOOKING_CARD_STRINGS } from "../model/strings";

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("uk-UA", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface BookingCardProps {
  booking: Booking;
  actions?: ReactNode;
}

export function BookingCard({ booking, actions }: BookingCardProps) {
  const createdAtLabel = DATE_TIME_FORMAT.format(new Date(booking.createdAt));
  const expiresAtLabel = DATE_TIME_FORMAT.format(
    getBookingExpiresAt(booking.createdAt),
  );

  return (
    <div className="flex flex-col gap-3">
      <PropertyCard property={booking.property} />

      <div className="flex flex-col gap-2 rounded-xl border-border bg-card p-4">
        <Badge variant="outline">{BOOKING_STATUS_LABELS[booking.status]}</Badge>

        <p className="text-xs text-muted-foreground">
          {BOOKING_CARD_STRINGS.created}: {createdAtLabel}
        </p>

        {booking.status === "ACTIVE" ? (
          <p className="text-xs text-muted-foreground">
            {BOOKING_CARD_STRINGS.expiresAt}: {expiresAtLabel}
          </p>
        ) : null}

        <p className="text-xs text-muted-foreground">
          {BOOKING_CARD_STRINGS.owner}: {booking.ownerName}{" "}
          <a
            href={`mailto:${booking.ownerEmail}`}
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            {booking.ownerEmail}
          </a>
        </p>

        {actions ? <div className="flex flex-col gap-1">{actions}</div> : null}
      </div>
    </div>
  );
}
