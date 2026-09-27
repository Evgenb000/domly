"use client";

import { useState } from "react";
import type { PropertyQueryDto } from "@domly/shared";
import type { PropertyFilterValues } from "@/entities/property";
import { EMPTY_FILTERS } from "@/entities/property";
import { PropertyFilters } from "@/widgets/property-filters";
import { PropertyFeed } from "@/widgets/property-feed";

type SortBy = PropertyQueryDto["sortBy"];
type SortOrder = PropertyQueryDto["sortOrder"];

const DEFAULT_SORT: { sortBy: SortBy; sortOrder: SortOrder } = {
  sortBy: "createdAt",
  sortOrder: "desc",
};

export function HomeView() {
  const [filters, setFilters] = useState<PropertyFilterValues>(EMPTY_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);

  return (
    <div className="flex flex-col gap-6">
      <PropertyFilters value={filters} onApply={setFilters} />
      <PropertyFeed
        filters={filters}
        sortBy={sort.sortBy}
        sortOrder={sort.sortOrder}
        onSortChange={(sortBy, sortOrder) => setSort({ sortBy, sortOrder })}
      />
    </div>
  );
}