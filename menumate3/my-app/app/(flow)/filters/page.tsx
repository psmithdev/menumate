"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiltersScreen } from "@/components/FiltersScreen";
import { useDishFilters, defaultFilters } from "@/hooks/useDishFilters";

type ParsedDish = {
  id: string;
  originalName: string;
  translatedName?: string;
  originalPrice: string;
  translatedPrice?: string;
  description?: string;
  tags: string[];
  isVegetarian: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isDairyFree?: boolean;
  isNutFree?: boolean;
  spiceLevel: number;
  rating?: number;
  time?: string;
  calories?: number;
  protein?: string;
  ingredients?: string[];
};

export default function FiltersPage() {
  const router = useRouter();
  const [parsedDishes, setParsedDishes] = useState<ParsedDish[]>([]);
  const [tempFilters, setTempFilters] = useState(defaultFilters);
  
  const {
    filteredDishes: tempFilteredDishes,
    filters: currentFilters,
  } = useDishFilters(parsedDishes);

  useEffect(() => {
    // Load dishes from sessionStorage
    const dishesData = sessionStorage.getItem("parsedDishes");
    if (dishesData) {
      setParsedDishes(JSON.parse(dishesData));
    } else {
      // No dishes data, redirect to results
      router.push("/results");
    }

    // Load current filters if they exist
    const filtersData = sessionStorage.getItem("currentFilters");
    if (filtersData) {
      setTempFilters(JSON.parse(filtersData));
    }
  }, [router]);

  const handleApply = () => {
    // Store filters and navigate back to results
    sessionStorage.setItem("currentFilters", JSON.stringify(tempFilters));
    router.push("/results");
  };

  const handleCancel = () => {
    setTempFilters(currentFilters); // Reset to current filters
    router.push("/results");
  };

  const handleReset = () => {
    setTempFilters(defaultFilters);
  };

  return (
    <FiltersScreen
      filters={tempFilters}
      filteredCount={tempFilteredDishes.length}
      isLoading={false}
      onFiltersChange={setTempFilters}
      onApply={handleApply}
      onCancel={handleCancel}
      onReset={handleReset}
    />
  );
}