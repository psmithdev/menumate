"use client";

import { DishCard } from "@/components/dish-card";
import type { ParsedDish } from "@/types/menu";

interface SimilarDishesProps {
  currentDish: ParsedDish;
  allDishes: ParsedDish[];
  onDishClick: (dish: ParsedDish) => void;
  maxSuggestions?: number;
}

export function SimilarDishes({ 
  currentDish, 
  allDishes, 
  onDishClick, 
  maxSuggestions = 3 
}: SimilarDishesProps) {
  
  const findSimilarDishes = (): ParsedDish[] => {
    const similarities = allDishes
      .filter(dish => dish.id !== currentDish.id)
      .map(dish => ({
        dish,
        score: calculateSimilarityScore(currentDish, dish)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);

    return similarities.map(item => item.dish);
  };

  const calculateSimilarityScore = (dish1: ParsedDish, dish2: ParsedDish): number => {
    let score = 0;
    
    // Same dietary preferences (high weight)
    if (dish1.isVegetarian && dish2.isVegetarian) score += 3;
    if (dish1.isVegan && dish2.isVegan) score += 3;
    if (dish1.isGlutenFree && dish2.isGlutenFree) score += 2;
    
    // Similar spice level (moderate weight)
    const spiceDiff = Math.abs(dish1.spiceLevel - dish2.spiceLevel);
    if (spiceDiff === 0) score += 2;
    else if (spiceDiff === 1) score += 1;
    
    // Shared tags (moderate weight)
    const sharedTags = dish1.tags.filter(tag => 
      dish2.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
    score += sharedTags.length * 1.5;
    
    // Similar price range (low weight)
    const price1 = extractPrice(dish1.originalPrice);
    const price2 = extractPrice(dish2.originalPrice);
    if (price1 > 0 && price2 > 0) {
      const priceDiff = Math.abs(price1 - price2);
      const avgPrice = (price1 + price2) / 2;
      const priceRatio = priceDiff / avgPrice;
      if (priceRatio < 0.3) score += 1; // Within 30% price range
    }
    
    // Similar rating (low weight)
    if (dish1.rating && dish2.rating) {
      const ratingDiff = Math.abs(dish1.rating - dish2.rating);
      if (ratingDiff < 0.5) score += 0.5;
    }
    
    return score;
  };

  const extractPrice = (priceString: string): number => {
    const match = priceString.match(/(\d+(?:\.\d{2})?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const similarDishes = findSimilarDishes();

  if (similarDishes.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-bold text-gray-900">You might also like</h3>
        <span className="text-2xl">👍</span>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Based on your dietary preferences and similar ingredients
      </p>
      
      <div className="space-y-4">
        {similarDishes.map((dish) => (
          <div key={dish.id} className="transform hover:scale-[1.02] transition-transform duration-200">
            <DishCard 
              dish={dish} 
              onClick={() => onDishClick(dish)}
            />
            
            {/* Why it's similar */}
            <div className="mt-2 px-2">
              <div className="flex flex-wrap gap-1">
                {getSimilarityReasons(currentDish, dish).map((reason, index) => (
                  <span 
                    key={index}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  function getSimilarityReasons(dish1: ParsedDish, dish2: ParsedDish): string[] {
    const reasons: string[] = [];
    
    if (dish1.isVegetarian && dish2.isVegetarian) reasons.push("🥬 Both vegetarian");
    if (dish1.isVegan && dish2.isVegan) reasons.push("🌱 Both vegan");
    if (dish1.spiceLevel === dish2.spiceLevel && dish1.spiceLevel > 0) {
      reasons.push(`🌶️ Same spice level`);
    }
    
    const sharedTags = dish1.tags.filter(tag => 
      dish2.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    ).slice(0, 2); // Only show first 2 shared tags
    
    sharedTags.forEach(tag => reasons.push(`🏷️ ${tag}`));
    
    // Price similarity
    const price1 = extractPrice(dish1.originalPrice);
    const price2 = extractPrice(dish2.originalPrice);
    if (price1 > 0 && price2 > 0) {
      const priceDiff = Math.abs(price1 - price2);
      const avgPrice = (price1 + price2) / 2;
      if (priceDiff / avgPrice < 0.2) reasons.push("💰 Similar price");
    }
    
    return reasons.slice(0, 3); // Max 3 reasons
  }
}