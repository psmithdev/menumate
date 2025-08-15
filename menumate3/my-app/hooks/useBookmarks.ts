"use client";

import { useState, useEffect, useCallback } from "react";
import { ParsedDish } from "@/hooks/useDishFilters";

const BOOKMARKS_STORAGE_KEY = "menumate-bookmarks";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<ParsedDish[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setBookmarks(parsed);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to load bookmarks:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to save bookmarks:", error);
        }
      }
    }
  }, [bookmarks, isLoading]);

  // Add a dish to bookmarks
  const addBookmark = useCallback((dish: ParsedDish) => {
    setBookmarks((prev) => {
      // Avoid duplicates
      if (prev.some((b) => b.id === dish.id)) {
        return prev;
      }
      return [...prev, { ...dish, id: `bookmark-${dish.id}-${Date.now()}` }];
    });
  }, []);

  // Remove a dish from bookmarks
  const removeBookmark = useCallback((dishId: string) => {
    setBookmarks((prev) => prev.filter((dish) => dish.id !== dishId));
  }, []);

  // Toggle bookmark status
  const toggleBookmark = useCallback((dish: ParsedDish) => {
    const isBookmarked = bookmarks.some((b) => b.originalName === dish.originalName && b.originalPrice === dish.originalPrice);
    
    if (isBookmarked) {
      // Remove bookmark
      setBookmarks((prev) => 
        prev.filter((b) => !(b.originalName === dish.originalName && b.originalPrice === dish.originalPrice))
      );
    } else {
      // Add bookmark
      addBookmark(dish);
    }
  }, [bookmarks, addBookmark]);

  // Check if a dish is bookmarked
  const isBookmarked = useCallback((dish: ParsedDish): boolean => {
    return bookmarks.some((b) => 
      b.originalName === dish.originalName && b.originalPrice === dish.originalPrice
    );
  }, [bookmarks]);

  // Clear all bookmarks
  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
  }, []);

  // Get bookmarks count
  const bookmarksCount = bookmarks.length;

  return {
    bookmarks,
    isLoading,
    bookmarksCount,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    clearBookmarks,
  };
}