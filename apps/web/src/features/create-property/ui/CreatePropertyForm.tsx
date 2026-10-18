"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreatePropertySchema,
  DealTypeEnum,
  PropertyCategoryEnum,
} from "@domly/shared";
import {
  createProperty,
  DEAL_TYPE_LABELS,
  PROPERTY_CATEGORY_LABELS,
  type PropertyDealType,
} from "@/entities/property";
import { useDistricts } from "@/entities/district";
import { useSessionStore } from "@/shared/session/store";
import { ApiError } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  LocationPicker,
  type Coordinates,
} from "@/shared/ui/location-picker";
import { cn } from "cn";
import { CREATE_PROPERTY_STRINGS } from "../model/strings";
import {
  CREATE_PROPERTY_DEFAULTS,
  type CreatePropertyFormValues,
} from "../model/defaults";
import { PhotosField } from "./PhotosField";
import { PriceFields } from "./PriceFields";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}

function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      {htmlFor !== undefined ? (
        <Label htmlFor={htmlFor}>{label}</Label>
      ) : (
        <Label>{label}</Label>
      )}
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export function CreatePropertyForm() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    districts,
    isLoading: districtsLoading,
    isError: districtsError,
  } = useDistricts();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    resetField,
    getFieldState,
    control,
    formState,
  } = useForm<CreatePropertyFormValues>({
    resolver: zodResolver(CreatePropertySchema),
    defaultValues: CREATE_PROPERTY_DEFAULTS,
  });

  const { errors, isSubmitting } = formState;

  const dealType = useWatch({ control, name: "dealType" });
  const category = useWatch({ control, name: "category" });
  const districtId = useWatch({ control, name: "districtId" });
  const hasDeposit = useWatch({ control, name: "hasDeposit" });
  const latitude = useWatch({ control, name: "latitude" });
  const longitude = useWatch({ control, name: "longitude" });

  const locationValue =
    typeof latitude === "number" && typeof longitude === "number"
      ? { latitude, longitude }
      : null;

  const hasLocationError = Boolean(errors.latitude || errors.longitude);
  const emailVerificationFailed = user?.emailVerified === false;

  const handleLocationChange = (coordinates: Coordinates) => {
    setValue("latitude", coordinates.latitude, { shouldValidate: true });
    setValue("longitude", coordinates.longitude, { shouldValidate: true });
  };

  const handleDealTypeChange = (next: PropertyDealType) => {
    setValue("dealType", next);
    resetField("price");
    resetField("pricePerNight");
    resetField("minStayNights");
    resetField("hasDeposit");
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const created = await createProperty(values);
      router.push(`/properties/${created.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          for (const fieldError of error.fieldErrors) {
            setError(fieldError.path as FieldPath<CreatePropertyFormValues>, {
              message: fieldError.message,
            });
          }
          return;
        }
        if (error.statusCode === 403) {
          setFormError(CREATE_PROPERTY_STRINGS.verifyEmailRequired);
          return;
        }
      }
      setFormError(CREATE_PROPERTY_STRINGS.genericError);
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-2xl flex-col gap-6">
      <FormField label={CREATE_PROPERTY_STRINGS.dealType}>
        <Select
          value={dealType}
          onValueChange={(v) => {
            if (v !== null) handleDealTypeChange(v);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DealTypeEnum.options.map((option) => (
              <SelectItem key={option} value={option}>
                {DEAL_TYPE_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label={CREATE_PROPERTY_STRINGS.category}>
        <Select
          value={category}
          onValueChange={(v) => {
            if (v !== null) {
              setValue("category", v, { shouldValidate: true });
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PropertyCategoryEnum.options.map((option) => (
              <SelectItem key={option} value={option}>
                {PROPERTY_CATEGORY_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField
        label={CREATE_PROPERTY_STRINGS.title}
        htmlFor="title"
        error={errors.title?.message}
      >
        <Input
          id="title"
          aria-invalid={Boolean(errors.title)}
          {...register("title")}
        />
      </FormField>

      <FormField
        label={CREATE_PROPERTY_STRINGS.description}
        htmlFor="description"
        error={errors.description?.message}
      >
        <TextArea
          id="description"
          rows={6}
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
      </FormField>

      <FormField
        label={CREATE_PROPERTY_STRINGS.area}
        htmlFor="area"
        error={errors.area?.message}
      >
        <Input
          id="area"
          type="number"
          aria-invalid={Boolean(errors.area)}
          {...register("area", {
            setValueAs: (v: string) => (v === "" ? undefined : Number(v)),
          })}
        />
      </FormField>

      <FormField
        label={CREATE_PROPERTY_STRINGS.address}
        htmlFor="address"
        error={errors.address?.message}
      >
        <Input
          id="address"
          aria-invalid={Boolean(errors.address)}
          {...register("address", {
            setValueAs: (v: string) => (v === "" ? undefined : v),
          })}
        />
      </FormField>

      <FormField
        label={CREATE_PROPERTY_STRINGS.district}
        error={errors.districtId?.message}
      >
        {districtsLoading ? (
          <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
        ) : (
          <Select
            value={districtId}
            disabled={districtsError}
            onValueChange={(v) => {
              if (v !== null) {
                setValue("districtId", v, { shouldValidate: true });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={CREATE_PROPERTY_STRINGS.districtPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.cityName} — {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {districtsError ? (
          <p className="text-xs text-destructive">
            {CREATE_PROPERTY_STRINGS.districtsError}
          </p>
        ) : null}
      </FormField>

      <PriceFields
        dealType={dealType}
        hasDeposit={hasDeposit}
        register={register}
        priceError={getFieldState("price", formState).error?.message}
        pricePerNightError={getFieldState("pricePerNight", formState).error?.message}
        minStayNightsError={getFieldState("minStayNights", formState).error?.message}
        hasDepositError={getFieldState("hasDeposit", formState).error?.message}
        onHasDepositChange={(checked) =>
          setValue("hasDeposit", checked, { shouldValidate: true })
        }
      />

      <FormField
        label={CREATE_PROPERTY_STRINGS.location}
        error={
          hasLocationError ? CREATE_PROPERTY_STRINGS.locationRequired : undefined
        }
      >
        <LocationPicker value={locationValue} onChange={handleLocationChange} />
      </FormField>

      <FormField
        label={CREATE_PROPERTY_STRINGS.photos}
        error={errors.photos?.message}
      >
        <Controller
          control={control}
          name="photos"
          render={({ field }) => (
            <PhotosField value={field.value} onChange={field.onChange} />
          )}
        />
      </FormField>

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

      {emailVerificationFailed ? (
        <div className="flex flex-col gap-1">
          <Button type="submit" disabled>
            {CREATE_PROPERTY_STRINGS.submit}
          </Button>
          <p className="text-xs text-muted-foreground">
            {CREATE_PROPERTY_STRINGS.verifyEmailRequired}
          </p>
        </div>
      ) : (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? CREATE_PROPERTY_STRINGS.submitting
            : CREATE_PROPERTY_STRINGS.submit}
        </Button>
      )}
    </form>
  );
}