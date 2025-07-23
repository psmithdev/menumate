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
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <div className="relative">
        <Image
          src={getDishImage(dish)}
          alt={dish.translatedName || dish.originalName}
          width={400}
          height={120}
          className="w-full h-28 object-cover"
        />
        <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-sm font-medium">
          {dish.translatedPrice || dish.originalPrice}
        </div>
      </div>
      <CardContent className="p-2">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg">
              {dish.translatedName || dish.originalName}
            </h3>
            <p className="text-sm text-gray-500">{dish.originalName}</p>
          </div>
          {dish.rating !== undefined && (
            <div className="flex items-center text-sm text-gray-600">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
              {dish.rating}
            </div>
          )}
        </div>

        <p className="text-gray-600 text-xs mb-2 line-clamp-2">
          {dish.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          {dish.prepTime && (
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {dish.prepTime}
            </div>
          )}
          <div className="flex items-center">
            {dish.spiceLevel ? "🌶️".repeat(dish.spiceLevel) : "😌"}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {dish.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {dish.isVegetarian && (
            <Badge
              variant="outline"
              className="text-xs text-green-600 border-green-600"
            >
              Vegetarian
            </Badge>
          )}
          {dish.isVegan && (
            <Badge
              variant="outline"
              className="text-xs text-green-700 border-green-700"
            >
              Vegan
            </Badge>
          )}
          {dish.isGlutenFree && (
            <Badge
              variant="outline"
              className="text-xs text-blue-600 border-blue-600"
            >
              Gluten Free
            </Badge>
          )}
        </div>
        <div className="flex justify-end">
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-1 px-3 rounded text-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              addToCart(dish);
            }}
          >
            Add to Cart
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
