"use client";

import React from "react";
import { Camera, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDishFilters, ParsedDish } from "@/hooks/useDishFilters";
// import { useBookmarks } from "@/hooks/useBookmarks";
import { SearchAndFilters } from "@/components/SearchAndFilters";
import { OCRResultsSection } from "@/components/OCRResultsSection";
import { DishGrid } from "@/components/DishGrid";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { CartButton } from "@/components/CartButton";
import DebugPanel from "@/components/DebugPanel";

interface ResultsScreenProps {
  parsedDishes: ParsedDish[];
  ocrText: string | null;
  translatedText: string | null;
  detectedLanguage: string;
  onDishClick: (dish: ParsedDish) => void;
  onFiltersClick: () => void;
  onShareClick: () => void;
  onTranslateClick: () => void;
  onRetakePhoto: () => void;
  getLanguageName: (code: string) => string;
}

export function ResultsScreen({
  parsedDishes,
  ocrText,
  translatedText,
  detectedLanguage,
  onDishClick,
  onFiltersClick,
  onShareClick,
  onTranslateClick,
  onRetakePhoto,
  getLanguageName,
}: ResultsScreenProps) {
  const {
    filteredDishes,
    filters,
    isLoading,
    filterStats,
    updateDietaryFilter,
    updatePriceRange,
    updateSpiceLevel,
    updateSortBy,
    updateSearchQuery,
    resetFilters,
  } = useDishFilters(parsedDishes);

  // Bookmarks functionality available but not used in this demo
  // const { toggleBookmark, isBookmarked } = useBookmarks();

  // Handle quick filter toggles
  const handleFilterToggle = (filterType: 'vegetarian' | 'spicy' | 'budget' | 'quick') => {
    switch (filterType) {
      case 'vegetarian':
        updateDietaryFilter('vegetarian', !filters.dietary.vegetarian);
        break;
      case 'spicy':
        updateSpiceLevel(filters.maxSpiceLevel < 4 ? 4 : 2);
        break;
      case 'budget':
        updatePriceRange(filters.priceRange.min, filters.priceRange.max <= 20 ? 50 : 20);
        break;
      case 'quick':
        updateSortBy(filters.sortBy === "time" ? "recommended" : "time");
        break;
    }
  };

  const enhancedOnDishClick = (dish: ParsedDish) => {
    // Add analytics or other logic here if needed
    onDishClick(dish);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 z-20 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Your Menu
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onFiltersClick}
                className={`rounded-lg h-8 px-3 text-xs ${
                  filterStats.activeFilters > 0
                    ? "border-orange-300 bg-orange-50 text-orange-700"
                    : ""
                }`}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                Filters
                {filterStats.activeFilters > 0 && (
                  <span className="ml-1 bg-orange-200 text-orange-800 rounded-full text-xs px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center">
                    {filterStats.activeFilters}
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onShareClick}
                className="rounded-lg h-8 px-3 text-xs"
                disabled={filteredDishes.length === 0}
              >
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <SearchAndFilters
            filters={filters}
            isLoading={isLoading}
            filterStats={filterStats}
            onSearchChange={updateSearchQuery}
            onFilterToggle={handleFilterToggle}
            onFilterClick={onFiltersClick}
            onClearFilters={resetFilters}
          />
        </div>
      </div>

      {/* OCR Results Section - Compact Mode */}
      {ocrText && (
        <OCRResultsSection
          ocrText={ocrText}
          translatedText={translatedText}
          detectedLanguage={detectedLanguage}
          onTranslateClick={onTranslateClick}
          getLanguageName={getLanguageName}
          compact={true}
        />
      )}

      {/* Dishes Grid */}
      <DishGrid
        dishes={filteredDishes}
        totalDishes={parsedDishes.length}
        searchQuery={filters.searchQuery}
        onDishClick={enhancedOnDishClick}
        onFilterClick={onFiltersClick}
        onClearFilters={resetFilters}
        onRetakePhoto={onRetakePhoto}
        ocrText={ocrText || undefined}
        enableVirtualScrolling={filteredDishes.length > 20}
      />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50">
        {/* Cart Button - Higher up to avoid overlap */}
        <div className="relative">
          <CartButton />
        </div>
        
        {/* New Photo Button */}
        <FloatingActionButton
          icon={Camera}
          onClick={onRetakePhoto}
          position={{ bottom: 0, right: 0 }}
          label="Take another photo"
          variant="primary"
          size="md"
        />
      </div>

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
}