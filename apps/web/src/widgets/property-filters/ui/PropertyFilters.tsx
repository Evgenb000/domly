"use client";

import { useState } from "react";
import { DealTypeEnum, PropertyCategoryEnum } from "@domly/shared";
import {
  DEAL_TYPE_LABELS,
  PROPERTY_CATEGORY_LABELS,
  EMPTY_FILTERS,
  type PropertyFilterValues,
} from "@/entities/property";
import { useDistricts } from "@/entities/district";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

const ANY_VALUE = "ANY";

interface PropertyFiltersProps {
  value: PropertyFilterValues;
  onApply: (filters: PropertyFilterValues) => void;
}

export function PropertyFilters({ value, onApply }: PropertyFiltersProps) {
  const [draft, setDraft] = useState<PropertyFilterValues>(value);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { districts, isLoading: districtsLoading } = useDistricts();

  function handleApply() {
    if (
      draft.priceMin !== undefined &&
      draft.priceMax !== undefined &&
      draft.priceMin > draft.priceMax
    ) {
      setValidationError("Мінімальна ціна не може бути більшою за максимальну");
      return;
    }
    if (
      draft.areaMin !== undefined &&
      draft.areaMax !== undefined &&
      draft.areaMin > draft.areaMax
    ) {
      setValidationError("Мінімальна площа не може бути більшою за максимальну");
      return;
    }
    setValidationError(null);
    onApply(draft);
  }

  function handleReset() {
    setValidationError(null);
    setDraft(EMPTY_FILTERS);
    onApply(EMPTY_FILTERS);
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          value={draft.dealType ?? ANY_VALUE}
          onValueChange={(v) =>
            setDraft((prev) => ({
              ...prev,
              dealType: v === ANY_VALUE ? undefined : (v as PropertyFilterValues["dealType"]),
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Тип угоди" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_VALUE}>Всі типи</SelectItem>
            {DealTypeEnum.options.map((option) => (
              <SelectItem key={option} value={option}>
                {DEAL_TYPE_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={draft.category ?? ANY_VALUE}
          onValueChange={(v) =>
            setDraft((prev) => ({
              ...prev,
              category: v === ANY_VALUE ? undefined : (v as PropertyFilterValues["category"]),
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Категорія" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_VALUE}>Всі категорії</SelectItem>
            {PropertyCategoryEnum.options.map((option) => (
              <SelectItem key={option} value={option}>
                {PROPERTY_CATEGORY_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={draft.districtId ?? ANY_VALUE}
          onValueChange={(v) =>
            setDraft((prev) => ({
              ...prev,
              districtId:
                v === ANY_VALUE || v === null ? undefined : v,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={districtsLoading ? "Завантаження..." : "Район"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_VALUE}>Всі райони</SelectItem>
            {districts.map((district) => (
              <SelectItem key={district.id} value={district.id}>
                {district.cityName} — {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Input
          type="number"
          placeholder="Ціна від"
          value={draft.priceMin ?? ""}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              priceMin: e.target.value === "" ? undefined : Number(e.target.value),
            }))
          }
        />
        <Input
          type="number"
          placeholder="Ціна до"
          value={draft.priceMax ?? ""}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              priceMax: e.target.value === "" ? undefined : Number(e.target.value),
            }))
          }
        />
        <Input
          type="number"
          placeholder="Площа від"
          value={draft.areaMin ?? ""}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              areaMin: e.target.value === "" ? undefined : Number(e.target.value),
            }))
          }
        />
        <Input
          type="number"
          placeholder="Площа до"
          value={draft.areaMax ?? ""}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              areaMax: e.target.value === "" ? undefined : Number(e.target.value),
            }))
          }
        />
      </div>

      {validationError ? (
        <p className="text-sm text-destructive">{validationError}</p>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button variant="ghost" type="button" onClick={handleReset}>
          Скинути
        </Button>
        <Button type="button" onClick={handleApply}>
          Застосувати
        </Button>
      </div>
    </div>
  );
}