"use client";

import Image from "next/image";
import { useState } from "react";
import type { ParsedDish } from "@/types/menu";
import { getDishImage } from "@/utils/dishImage";

interface DishImageProps {
  dish: ParsedDish;
  className?: string;
  priority?: boolean;
  showPrice?: boolean;
}

export function DishImage({ dish, className = "", priority = false, showPrice = true }: DishImageProps) {
  const [imageError, setImageError] = useState(false);
  
  const imageSrc = getDishImage(dish);
  const fallbackSrc = "/placeholder.svg";
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={imageError ? fallbackSrc : imageSrc}
        alt={dish.translatedName || dish.originalName}
        fill
        className="object-cover transition-transform duration-300 hover:scale-105"
        priority={priority}
        onError={() => setImageError(true)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      
      {/* Price badge */}
      {showPrice && (
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
          <span className="font-bold text-orange-600 text-sm sm:text-base">
            {dish.translatedPrice || dish.originalPrice}
          </span>
        </div>
      )}
      
      {/* Dietary badges */}
      <div className="absolute top-4 left-4 flex flex-col gap-1">
        {dish.isVegetarian && (
          <div className="bg-green-500/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
            🥬 Veg
          </div>
        )}
        {dish.isVegan && (
          <div className="bg-emerald-500/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
            🌱 Vegan
          </div>
        )}
        {dish.isGlutenFree && (
          <div className="bg-blue-500/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
            🌾 GF
          </div>
        )}
      </div>
      
      {/* Spice level indicator */}
      {dish.spiceLevel > 0 && (
        <div className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          {"🌶️".repeat(Math.min(dish.spiceLevel, 3))}
          {dish.spiceLevel > 3 && "🔥"}
        </div>
      )}
    </div>
  );
}