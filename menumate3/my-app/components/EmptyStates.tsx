"use client";

import React from "react";
import { Search, Filter, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "no-dishes" | "no-results" | "search-no-results";
  totalDishes?: number;
  searchQuery?: string;
  onFilterClick?: () => void;
  onClearFilters?: () => void;
  onRetakePhoto?: () => void;
  ocrText?: string;
}

export function EmptyState({
  type,
  totalDishes = 0,
  searchQuery = "",
  onFilterClick,
  onClearFilters,
  onRetakePhoto,
  ocrText,
}: EmptyStateProps) {
  if (type === "no-dishes") {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Dishes Found
        </h3>
        
        <p className="text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">
          We couldn&apos;t find any dishes in your menu image. This might happen if the text 
          is unclear or the menu format is unusual.
        </p>

        <div className="space-y-3">
          <Button
            onClick={onRetakePhoto}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl"
          >
            <Camera className="w-4 h-4 mr-2" />
            Try Another Photo
          </Button>
          
          {process.env.NODE_ENV === "development" && ocrText && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-blue-600 text-sm hover:text-blue-800">
                View Extracted Text (Debug)
              </summary>
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                  {ocrText}
                </pre>
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  if (type === "no-results") {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Filter className="w-8 h-8 text-orange-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Matches Found
        </h3>
        
        <p className="text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">
          We found {totalDishes} dishes total, but none match your current preferences. 
          Try adjusting your filters to see more options.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="px-6 py-2 rounded-xl border-gray-300 hover:bg-gray-50"
          >
            Clear All Filters
          </Button>
          
          <Button
            onClick={onFilterClick}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl"
          >
            <Filter className="w-4 h-4 mr-2" />
            Adjust Filters
          </Button>
        </div>
      </div>
    );
  }

  if (type === "search-no-results") {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-blue-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Search Results
        </h3>
        
        <p className="text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">
          No dishes match &quot;{searchQuery}&quot;. Try searching for different ingredients, 
          dish names, or categories.
        </p>

        <div className="space-y-4">
          <Button
            onClick={() => onClearFilters?.()}
            variant="outline"
            className="px-6 py-2 rounded-xl border-gray-300 hover:bg-gray-50"
          >
            Clear Search
          </Button>

          {/* Search Suggestions */}
          <div className="text-sm text-gray-600">
            <p className="mb-2">Try searching for:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["chicken", "vegetarian", "spicy", "noodles", "curry", "salad"].map((suggestion) => (
                <span
                  key={suggestion}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 cursor-pointer transition-colors"
                  onClick={() => {
                    // This would need to be passed as a prop to work
                    // onSearchChange?.(suggestion);
                  }}
                >
                  {suggestion}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}