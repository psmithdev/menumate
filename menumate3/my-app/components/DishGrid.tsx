"use client";

import React, { useState, useRef, useEffect } from "react";
import { DishCard } from "@/components/dish-card";
import { ParsedDish } from "@/hooks/useDishFilters";
import { EmptyState } from "@/components/EmptyStates";

interface DishGridProps {
  dishes: ParsedDish[];
  totalDishes: number;
  searchQuery: string;
  onDishClick: (dish: ParsedDish) => void;
  onFilterClick: () => void;
  onClearFilters: () => void;
  onRetakePhoto: () => void;
  ocrText?: string;
  enableVirtualScrolling?: boolean;
  itemHeight?: number;
}

export function DishGrid({
  dishes,
  totalDishes,
  searchQuery,
  onDishClick,
  onFilterClick,
  onClearFilters,
  onRetakePhoto,
  ocrText,
  enableVirtualScrolling = false,
  itemHeight = 200,
}: DishGridProps) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Virtual scrolling effect
  useEffect(() => {
    if (!enableVirtualScrolling || !containerRef.current) return;

    const container = containerRef.current;
    const itemsPerRow = window.innerWidth >= 768 ? 2 : 1; // md breakpoint
    const visibleRows = Math.ceil(containerHeight / itemHeight);
    const bufferRows = 2; // Extra rows for smooth scrolling

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferRows);
      const endRow = Math.min(
        Math.ceil(dishes.length / itemsPerRow),
        Math.ceil(scrollTop / itemHeight) + visibleRows + bufferRows
      );

      setVisibleRange({
        start: startRow * itemsPerRow,
        end: endRow * itemsPerRow,
      });
    };

    // Set initial container height
    const resizeObserver = new ResizeObserver((entries) => {
      setContainerHeight(entries[0].contentRect.height);
    });
    
    resizeObserver.observe(container);
    container.addEventListener('scroll', handleScroll);

    // Set initial visible range
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [enableVirtualScrolling, dishes.length, itemHeight, containerHeight]);

  // Determine which empty state to show
  const getEmptyStateType = (): "no-dishes" | "no-results" | "search-no-results" => {
    if (totalDishes === 0) return "no-dishes";
    if (searchQuery.trim()) return "search-no-results";
    return "no-results";
  };

  // Show empty state if no dishes
  if (dishes.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          type={getEmptyStateType()}
          totalDishes={totalDishes}
          searchQuery={searchQuery}
          onFilterClick={onFilterClick}
          onClearFilters={onClearFilters}
          onRetakePhoto={onRetakePhoto}
          ocrText={ocrText}
        />
      </div>
    );
  }

  // Regular grid rendering (default)
  if (!enableVirtualScrolling) {
    return (
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dishes.map((dish) => (
            <div key={dish.id} className="relative">
              <DishCard
                dish={dish}
                onClick={() => onDishClick(dish)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Virtual scrolling rendering
  const visibleDishes = dishes.slice(visibleRange.start, visibleRange.end);
  const totalHeight = Math.ceil(dishes.length / 2) * itemHeight; // Assuming 2 columns
  const offsetY = Math.floor(visibleRange.start / 2) * itemHeight;

  return (
    <div 
      ref={containerRef}
      className="p-4 overflow-auto"
      style={{ height: '100%' }}
    >
      {/* Spacer for items before visible range */}
      {offsetY > 0 && <div style={{ height: offsetY }} />}
      
      {/* Visible items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visibleDishes.map((dish) => (
          <div key={dish.id} className="relative">
            <DishCard
              dish={dish}
              onClick={() => onDishClick(dish)}
            />
          </div>
        ))}
      </div>
      
      {/* Spacer for items after visible range */}
      {totalHeight - offsetY - visibleDishes.length * (itemHeight / 2) > 0 && (
        <div style={{ 
          height: totalHeight - offsetY - Math.ceil(visibleDishes.length / 2) * itemHeight 
        }} />
      )}
    </div>
  );
}