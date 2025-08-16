"use client";

import React from "react";
import { Search, Filter, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DishFilters } from "@/hooks/useDishFilters";

interface SearchAndFiltersProps {
  filters: DishFilters;
  isLoading: boolean;
  filterStats: {
    total: number;
    filtered: number;
    activeFilters: number;
    hasActiveFilters: boolean;
  };
  onSearchChange: (query: string) => void;
  onFilterToggle: (filterType: 'vegetarian' | 'spicy' | 'budget' | 'quick') => void;
  onFilterClick: () => void;
  onClearFilters: () => void;
}

export function SearchAndFilters({
  filters,
  isLoading,
  filterStats,
  onSearchChange,
  onFilterToggle,
  onFilterClick,
  onClearFilters,
}: SearchAndFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search dishes, ingredients, or categories..."
          value={filters.searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4 h-12 text-base rounded-xl border-gray-300 focus:border-orange-400 focus:ring-orange-200"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {/* Vegetarian Filter */}
          <Badge
            variant={filters.dietary.vegetarian ? "secondary" : "outline"}
            className={`whitespace-nowrap cursor-pointer touch-manipulation min-h-[36px] px-3 transition-all ${
              filters.dietary.vegetarian
                ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                : "hover:bg-gray-100"
            }`}
            onClick={() => onFilterToggle('vegetarian')}
          >
            🌱 Vegetarian
          </Badge>

          {/* Spicy Filter */}
          <Badge
            variant={filters.maxSpiceLevel < 4 ? "secondary" : "outline"}
            className={`whitespace-nowrap cursor-pointer touch-manipulation min-h-[36px] px-3 transition-all ${
              filters.maxSpiceLevel < 4
                ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                : "hover:bg-gray-100"
            }`}
            onClick={() => onFilterToggle('spicy')}
          >
            🌶️ Mild Only
          </Badge>

          {/* Budget Filter */}
          <Badge
            variant={filters.priceRange.max <= 20 ? "secondary" : "outline"}
            className={`whitespace-nowrap cursor-pointer touch-manipulation min-h-[36px] px-3 transition-all ${
              filters.priceRange.max <= 20
                ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                : "hover:bg-gray-100"
            }`}
            onClick={() => onFilterToggle('budget')}
          >
            💰 Budget
          </Badge>

          {/* Quick Filter */}
          <Badge
            variant={filters.sortBy === "time" ? "secondary" : "outline"}
            className={`whitespace-nowrap cursor-pointer touch-manipulation min-h-[36px] px-3 transition-all ${
              filters.sortBy === "time"
                ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
                : "hover:bg-gray-100"
            }`}
            onClick={() => onFilterToggle('quick')}
          >
            ⚡ Quick
          </Badge>
        </div>

        {/* Filter Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Clear Filters */}
          {filterStats.hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700 h-9 px-3"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Loading indicator only when filtering */}
      {isLoading && (
        <div className="flex items-center justify-center text-sm text-gray-600 py-1">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Filtering...
        </div>
      )}
    </div>
  );
}