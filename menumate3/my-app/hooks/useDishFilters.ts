"use client";

import { useState, useCallback, useMemo } from "react";

export interface DishFilters {
  dietary: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    nutFree: boolean;
  };
  maxSpiceLevel: number;
  priceRange: { min: number; max: number };
  sortBy: "recommended" | "rating" | "price" | "time";
  searchQuery: string;
}

export interface ParsedDish {
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
}

export const defaultFilters: DishFilters = {
  dietary: {
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
  },
  maxSpiceLevel: 4,
  priceRange: { min: 0, max: 200 },
  sortBy: "recommended",
  searchQuery: "",
};

export function useDishFilters(dishes: ParsedDish[]) {
  const [filters, setFilters] = useState<DishFilters>(defaultFilters);

  // Enhanced function to extract price number from price string with multiple currency support
  const extractPriceNumber = useCallback((priceString: string): number => {
    if (!priceString || priceString === "Price not detected") return 0;

    // Enhanced regex to handle various price formats including currencies and Thai baht
    const priceMatch = priceString.match(
      /(?:[฿$€£¥₹₽]?\s?)?(\d{1,5}(?:[.,]\d{1,3})?)\s?(?:บาท|baht|dollars?|euros?|pounds?|yen|rupees?|฿|$|€|£|¥|₹|₽)?/i
    );

    if (priceMatch) {
      let price = parseFloat(priceMatch[1].replace(",", "."));

      // Convert common currencies to USD equivalent for comparison
      // These are rough conversions for filter comparison purposes
      if (
        priceString.includes("฿") ||
        priceString.includes("บาท") ||
        priceString.toLowerCase().includes("baht")
      ) {
        price = price * 0.028; // THB to USD (updated rate ~36 THB = 1 USD)
      } else if (priceString.includes("¥") || priceString.includes("￥")) {
        price = price * 0.0067; // JPY to USD (updated rate ~150 JPY = 1 USD)
      } else if (priceString.includes("€")) {
        price = price * 1.08; // EUR to USD (updated rate)
      } else if (priceString.includes("£")) {
        price = price * 1.25; // GBP to USD (updated rate)
      } else if (priceString.includes("₹")) {
        price = price * 0.012; // INR to USD (~83 INR = 1 USD)
      }
      // Default assumes USD or treats as USD equivalent

      return price;
    }

    return 0;
  }, []);

  // Function to filter and sort dishes based on current filters
  const applyFilters = useCallback(
    (dishesToFilter: ParsedDish[]): ParsedDish[] => {
      const filteredDishes = dishesToFilter.filter((dish) => {
        // Search query filter
        if (filters.searchQuery.trim()) {
          const query = filters.searchQuery.toLowerCase();
          const dishName = (dish.translatedName || dish.originalName).toLowerCase();
          const description = (dish.description || "").toLowerCase();
          const tags = dish.tags.join(" ").toLowerCase();
          
          if (!dishName.includes(query) && !description.includes(query) && !tags.includes(query)) {
            return false;
          }
        }

        // Dietary filters
        if (filters.dietary.vegetarian && !dish.isVegetarian) return false;
        if (filters.dietary.vegan && !dish.isVegan) return false;
        if (filters.dietary.glutenFree && !dish.isGlutenFree) return false;
        if (filters.dietary.dairyFree && !dish.isDairyFree) return false;
        if (filters.dietary.nutFree && !dish.isNutFree) return false;

        // Spice level filter
        if (dish.spiceLevel > filters.maxSpiceLevel) return false;

        // Price range filter
        const price = extractPriceNumber(dish.originalPrice);
        if (
          price > 0 &&
          (price < filters.priceRange.min || price > filters.priceRange.max)
        )
          return false;

        return true;
      });

      // Sort the filtered dishes with enhanced sorting logic
      const sortedDishes = filteredDishes.sort((a, b) => {
        switch (filters.sortBy) {
          case "rating":
            // Sort by rating, then by name for tie-breaking
            const ratingDiff = (b.rating || 4.0) - (a.rating || 4.0);
            return ratingDiff !== 0
              ? ratingDiff
              : a.originalName.localeCompare(b.originalName);

          case "price":
            // Sort by price, handling "Price not detected" items by putting them last
            const priceA = extractPriceNumber(a.originalPrice);
            const priceB = extractPriceNumber(b.originalPrice);
            if (priceA === 0 && priceB === 0)
              return a.originalName.localeCompare(b.originalName);
            if (priceA === 0) return 1; // Move "Price not detected" to end
            if (priceB === 0) return -1; // Move "Price not detected" to end
            return priceA - priceB;

          case "time":
            // Sort by preparation time, then by rating
            const aTime = parseInt(a.time?.match(/\d+/)?.[0] || "15");
            const bTime = parseInt(b.time?.match(/\d+/)?.[0] || "15");
            const timeDiff = aTime - bTime;
            return timeDiff !== 0
              ? timeDiff
              : (b.rating || 4.0) - (a.rating || 4.0);

          default: // recommended - intelligent sorting based on multiple factors
            // Sort by a combination of rating, spice level preference, and alphabetical
            let score = 0;

            // Factor in rating (higher is better)
            score += (b.rating || 4.0) - (a.rating || 4.0);

            // Factor in vegetarian preference if filter is active
            if (
              filters.dietary.vegetarian &&
              a.isVegetarian !== b.isVegetarian
            ) {
              score += a.isVegetarian ? 1 : -1;
            }

            // Factor in spice level preference (closer to max preference is better)
            const spiceDiffA = Math.abs(a.spiceLevel - filters.maxSpiceLevel);
            const spiceDiffB = Math.abs(b.spiceLevel - filters.maxSpiceLevel);
            score += (spiceDiffA - spiceDiffB) * 0.1;

            // Fall back to alphabetical for tie-breaking
            return score !== 0
              ? score
              : a.originalName.localeCompare(b.originalName);
        }
      });

      return sortedDishes;
    },
    [filters, extractPriceNumber]
  );

  // Memoized filtered and sorted dishes
  const filteredDishes = useMemo(() => {
    return applyFilters(dishes);
  }, [dishes, applyFilters]);

  // Helper functions for updating filters
  const updateDietaryFilter = useCallback((key: keyof DishFilters['dietary'], value: boolean) => {
    setFilters(prev => ({
      ...prev,
      dietary: { ...prev.dietary, [key]: value }
    }));
  }, []);

  const updatePriceRange = useCallback((min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      priceRange: { min, max }
    }));
  }, []);

  const updateSpiceLevel = useCallback((level: number) => {
    setFilters(prev => ({
      ...prev,
      maxSpiceLevel: level
    }));
  }, []);

  const updateSortBy = useCallback((sortBy: DishFilters['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy
    }));
  }, []);

  const updateSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: query
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // Filter statistics
  const filterStats = useMemo(() => {
    const totalDishes = dishes.length;
    const filteredCount = filteredDishes.length;
    const activeFiltersCount = Object.values(filters.dietary).filter(Boolean).length +
      (filters.maxSpiceLevel < 4 ? 1 : 0) +
      (filters.priceRange.max < 200 ? 1 : 0) +
      (filters.searchQuery.trim() ? 1 : 0);

    return {
      total: totalDishes,
      filtered: filteredCount,
      activeFilters: activeFiltersCount,
      hasActiveFilters: activeFiltersCount > 0,
    };
  }, [dishes.length, filteredDishes.length, filters]);

  return {
    filters,
    filteredDishes,
    filterStats,
    setFilters,
    updateDietaryFilter,
    updatePriceRange,
    updateSpiceLevel,
    updateSortBy,
    updateSearchQuery,
    resetFilters,
  };
}