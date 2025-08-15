"use client";

import type { ParsedDish } from "@/types/menu";

interface NutritionInfoProps {
  dish: ParsedDish;
  className?: string;
}

interface NutritionItem {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
}

export function NutritionInfo({ dish, className = "" }: NutritionInfoProps) {
  // Enhanced nutrition calculation based on dish characteristics
  const calculateNutrition = (dish: ParsedDish): NutritionItem[] => {
    const baseCalories = dish.calories || estimateCalories(dish);
    const baseProtein = dish.protein || estimateProtein(dish);
    
    return [
      {
        label: "Calories",
        value: baseCalories,
        icon: "🔥"
      },
      {
        label: "Protein",
        value: baseProtein.replace('g', ''),
        unit: "g",
        icon: "💪"
      },
      {
        label: "Prep Time",
        value: dish.time?.replace(' min', '') || "15",
        unit: "min",
        icon: "⏱️"
      },
      {
        label: "Spice Level",
        value: dish.spiceLevel,
        unit: "/4",
        icon: dish.spiceLevel > 2 ? "🔥" : "🌶️"
      }
    ];
  };

  const estimateCalories = (dish: ParsedDish): number => {
    let calories = 300; // base
    
    // Adjust based on dish characteristics
    if (dish.tags.some(tag => tag.toLowerCase().includes('rice'))) calories += 100;
    if (dish.tags.some(tag => tag.toLowerCase().includes('noodle'))) calories += 150;
    if (dish.tags.some(tag => tag.toLowerCase().includes('curry'))) calories += 80;
    if (dish.tags.some(tag => tag.toLowerCase().includes('salad'))) calories -= 100;
    if (dish.isVegetarian && !dish.tags.some(tag => tag.toLowerCase().includes('cheese'))) calories -= 50;
    
    return Math.max(calories, 150); // minimum 150 calories
  };

  const estimateProtein = (dish: ParsedDish): string => {
    let protein = 15; // base grams
    
    // Adjust based on dish characteristics
    if (dish.tags.some(tag => ['chicken', 'beef', 'pork', 'fish'].some(meat => tag.toLowerCase().includes(meat)))) {
      protein += 10;
    }
    if (dish.tags.some(tag => tag.toLowerCase().includes('tofu'))) protein += 5;
    if (dish.isVegetarian && dish.tags.some(tag => tag.toLowerCase().includes('bean'))) protein += 8;
    if (dish.tags.some(tag => tag.toLowerCase().includes('egg'))) protein += 6;
    
    return `${protein}g`;
  };

  const nutritionItems = calculateNutrition(dish);

  return (
    <div className={`bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        📊 Nutrition & Details
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {nutritionItems.map((item, index) => (
          <div key={index} className="text-center">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-lg font-bold text-gray-900">
              {item.value}
              {item.unit && <span className="text-sm text-gray-500">{item.unit}</span>}
            </div>
            <div className="text-xs text-gray-600">{item.label}</div>
          </div>
        ))}
      </div>
      
      {/* Additional nutrition notes */}
      <div className="mt-4 pt-3 border-t border-orange-200">
        <div className="flex flex-wrap gap-2 text-xs">
          {dish.isDairyFree && (
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              🥛 Dairy-free
            </span>
          )}
          {dish.isNutFree && (
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              🥜 Nut-free
            </span>
          )}
          {dish.rating && dish.rating > 4 && (
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              ⭐ Highly rated
            </span>
          )}
        </div>
      </div>
    </div>
  );
}