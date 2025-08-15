"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { DishFilters } from "@/hooks/useDishFilters";

interface FiltersScreenProps {
  filters: DishFilters;
  filteredCount: number;
  isLoading: boolean;
  onFiltersChange: (filters: DishFilters) => void;
  onApply: () => void;
  onCancel: () => void;
  onReset: () => void;
}

export function FiltersScreen({
  filters,
  filteredCount,
  isLoading,
  onFiltersChange,
  onApply,
  onCancel,
  onReset,
}: FiltersScreenProps) {
  const updateFilter = (updates: Partial<DishFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const updateDietaryFilter = (key: keyof DishFilters['dietary'], value: boolean) => {
    updateFilter({
      dietary: { ...filters.dietary, [key]: value }
    });
  };

  const updatePriceRange = (max: number) => {
    updateFilter({
      priceRange: { ...filters.priceRange, max }
    });
  };

  const updateSpiceLevel = (level: number) => {
    updateFilter({ maxSpiceLevel: level });
  };

  const updateSortBy = (sortBy: DishFilters['sortBy']) => {
    updateFilter({ sortBy });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-gray-600 hover:bg-gray-100"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <h1 className="text-lg font-semibold">Filters & Preferences</h1>
          <Button
            onClick={onApply}
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Applying...
              </>
            ) : (
              `Apply (${filteredCount})`
            )}
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Dietary Preferences */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Dietary Preferences
          </h3>
          <div className="space-y-4">
            {[
              { label: "Vegetarian", icon: "🥬", key: "vegetarian" as const },
              { label: "Vegan", icon: "🌱", key: "vegan" as const },
              {
                label: "Gluten-Free",
                icon: "🌾",
                key: "glutenFree" as const,
              },
              { label: "Dairy-Free", icon: "🥛", key: "dairyFree" as const },
              { label: "Nut-Free", icon: "🥜", key: "nutFree" as const },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${
                  isLoading ? 'bg-gray-100 opacity-50' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-gray-900">
                    {item.label}
                  </span>
                </div>
                <button
                  onClick={() => updateDietaryFilter(item.key, !filters.dietary[item.key])}
                  disabled={isLoading}
                  className={`w-12 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    filters.dietary[item.key]
                      ? "bg-orange-500"
                      : "bg-gray-300"
                  }`}
                  aria-label={`Toggle ${item.label} filter`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      filters.dietary[item.key]
                        ? "translate-x-6"
                        : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Spice Level */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Maximum Spice Level
          </h3>
          <div className={`rounded-2xl p-6 transition-colors ${
            isLoading ? 'bg-gray-100 opacity-50' : 'bg-gray-50'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl">😌</span>
              <span className="text-2xl">🌶️</span>
              <span className="text-2xl">🌶️🌶️</span>
              <span className="text-2xl">🌶️🌶️🌶️</span>
              <span className="text-2xl">🔥</span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              value={filters.maxSpiceLevel}
              onChange={(e) => updateSpiceLevel(parseInt(e.target.value))}
              disabled={isLoading}
              className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer slider disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Maximum spice level"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Mild</span>
              <span>Very Spicy</span>
            </div>
            <div className="text-center mt-2 text-sm font-medium text-gray-700">
              Level {filters.maxSpiceLevel} {filters.maxSpiceLevel === 0 ? '(Mild only)' : filters.maxSpiceLevel === 4 ? '(All levels)' : `& below`}
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Price Range
          </h3>
          <div className={`rounded-2xl p-6 transition-colors ${
            isLoading ? 'bg-gray-100 opacity-50' : 'bg-gray-50'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-gray-900">
                ${filters.priceRange.min}
              </span>
              <span className="font-semibold text-gray-900">
                ${filters.priceRange.max}+
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={filters.priceRange.max}
              onChange={(e) => updatePriceRange(parseInt(e.target.value))}
              disabled={isLoading}
              className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Maximum price"
            />
            <div className="text-center mt-2 text-sm text-gray-600">
              Show dishes up to ${filters.priceRange.max}
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sort By
          </h3>
          <div className="space-y-2">
            {[
              {
                label: "Recommended for you",
                description: "Based on your preferences and popularity",
                icon: "⭐",
                value: "recommended" as const,
              },
              {
                label: "Highest rated",
                description: "Sort by customer ratings",
                icon: "👍",
                value: "rating" as const,
              },
              {
                label: "Price: Low to high",
                description: "Most affordable first",
                icon: "💰",
                value: "price" as const,
              },
              {
                label: "Preparation time",
                description: "Fastest dishes first",
                icon: "⏱️",
                value: "time" as const,
              },
            ].map((item) => (
              <div
                key={item.label}
                onClick={() => !isLoading && updateSortBy(item.value)}
                className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                  isLoading
                    ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                    : filters.sortBy === item.value
                    ? "bg-orange-50 border-2 border-orange-200 hover:bg-orange-100"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <span className="text-xl mt-0.5">{item.icon}</span>
                <div className="flex-1">
                  <div className={`font-medium ${
                    filters.sortBy === item.value
                      ? "text-orange-700"
                      : "text-gray-900"
                  }`}>
                    {item.label}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {item.description}
                  </div>
                </div>
                {filters.sortBy === item.value && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={onReset}
          disabled={isLoading}
          className="w-full h-12 rounded-2xl border-gray-300 text-gray-600 bg-transparent hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset All Filters
        </Button>
        
        {/* Status Message */}
        {isLoading && (
          <div className="text-center text-sm text-gray-500">
            Updating results...
          </div>
        )}
      </div>
    </div>
  );
}