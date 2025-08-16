import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock } from "lucide-react";
import Image from "next/image";
import { useCart } from "./CartContext";
import type { ParsedDish } from "../types/menu";
import { getDishImage } from "../utils/dishImage";

interface DishCardProps {
  dish: ParsedDish & {
    image?: string;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    prepTime?: string;
    price?: string; // for compatibility
  };
  onClick?: () => void;
}

export function DishCard({ dish, onClick }: DishCardProps) {
  const { addToCart } = useCart();
  
  // Get only the most important dietary badges (max 2)
  const getDietaryBadges = () => {
    const badges = [];
    if (dish.isVegan) badges.push({ text: "🌱", color: "text-green-600" });
    else if (dish.isVegetarian) badges.push({ text: "🥗", color: "text-green-600" });
    if (dish.isGlutenFree) badges.push({ text: "🌾", color: "text-blue-600" });
    return badges.slice(0, 2);
  };

  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 border-0 shadow-sm" onClick={onClick}>
      <div className="relative">
        <Image
          src={getDishImage(dish)}
          alt={dish.translatedName || dish.originalName}
          width={400}
          height={96}
          className="w-full h-24 object-cover"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-sm font-semibold">
          {dish.translatedPrice || dish.originalPrice}
        </div>
        {/* Spice level indicator */}
        {dish.spiceLevel && dish.spiceLevel > 0 && (
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
            <span className="text-xs">{"🌶️".repeat(Math.min(dish.spiceLevel, 3))}</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base leading-tight truncate">
              {dish.translatedName || dish.originalName}
            </h3>
            {/* Show original name only if different from translated */}
            {dish.translatedName && dish.translatedName !== dish.originalName && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{dish.originalName}</p>
            )}
          </div>
          
          {/* Compact info section */}
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {dish.rating !== undefined && (
              <div className="flex items-center text-xs text-gray-600">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-0.5" />
                {dish.rating}
              </div>
            )}
            {getDietaryBadges().map((badge, index) => (
              <span key={index} className={`text-sm ${badge.color}`}>
                {badge.text}
              </span>
            ))}
          </div>
        </div>

        {/* Description - only show if it exists and is meaningful */}
        {dish.description && dish.description.trim() && (
          <p className="text-gray-600 text-xs line-clamp-1 mb-2">
            {dish.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          {/* Show only the most relevant tag */}
          <div className="flex-1">
            {dish.tags.length > 0 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {dish.tags[0]}
              </Badge>
            )}
          </div>
          
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition-colors ml-2"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(dish);
            }}
          >
            Add
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
