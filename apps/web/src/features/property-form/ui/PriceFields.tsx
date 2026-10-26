"use client";

import type { UseFormRegister } from "react-hook-form";
import type { PropertyDealType } from "@/entities/property";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PROPERTY_FORM_STRINGS } from "../model/strings";
import type { PropertyFormValues } from "@/entities/property";

interface PriceFieldsProps {
  dealType: PropertyDealType;
  hasDeposit: boolean;
  register: UseFormRegister<PropertyFormValues>;
  priceError?: string;
  pricePerNightError?: string;
  minStayNightsError?: string;
  hasDepositError?: string;
  onHasDepositChange: (checked: boolean) => void;
}

export function PriceFields({
  dealType,
  hasDeposit,
  register,
  priceError,
  pricePerNightError,
  minStayNightsError,
  hasDepositError,
  onHasDepositChange,
}: PriceFieldsProps) {
  if (dealType === "DAILY_RENT") {
    return (
      <>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pricePerNight">
            {PROPERTY_FORM_STRINGS.pricePerNight}
          </Label>
          <Input
            id="pricePerNight"
            type="number"
            aria-invalid={Boolean(pricePerNightError)}
            {...register("pricePerNight", {
              setValueAs: (v: string) => (v === "" ? undefined : Number(v)),
            })}
          />
          {pricePerNightError ? (
            <p className="text-xs text-destructive">{pricePerNightError}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="minStayNights">
            {PROPERTY_FORM_STRINGS.minStayNights}
          </Label>
          <Input
            id="minStayNights"
            type="number"
            aria-invalid={Boolean(minStayNightsError)}
            {...register("minStayNights", {
              setValueAs: (v: string) => (v === "" ? undefined : Number(v)),
            })}
          />
          {minStayNightsError ? (
            <p className="text-xs text-destructive">{minStayNightsError}</p>
          ) : null}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="price">{PROPERTY_FORM_STRINGS.price}</Label>
        <Input
          id="price"
          type="number"
          aria-invalid={Boolean(priceError)}
          {...register("price", {
            setValueAs: (v: string) => (v === "" ? undefined : Number(v)),
          })}
        />
        {priceError ? (
          <p className="text-xs text-destructive">{priceError}</p>
        ) : null}
      </div>

      {dealType === "LONG_TERM_RENT" ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              id="hasDeposit"
              type="checkbox"
              checked={hasDeposit}
              onChange={(e) => onHasDepositChange(e.target.checked)}
              className="size-4 accent-primary"
              aria-invalid={Boolean(hasDepositError)}
            />
            <Label htmlFor="hasDeposit">{PROPERTY_FORM_STRINGS.hasDeposit}</Label>
          </div>
          {hasDepositError ? (
            <p className="text-xs text-destructive">{hasDepositError}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}