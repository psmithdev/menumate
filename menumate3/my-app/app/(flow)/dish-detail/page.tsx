"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DishImage } from "@/components/DishImage";
import { NutritionInfo } from "@/components/NutritionInfo";
import { DishActionButtons } from "@/components/DishActionButtons";
import { SimilarDishes } from "@/components/SimilarDishes";
import { enhanceDishWithOCR } from "@/utils/enhancedDishParser";
import { Star, Clock, CheckCircle } from "lucide-react";

type ParsedDish = {
  id: string;
  originalName: string;
  translatedName?: string;
  originalPrice: string;
  translatedPrice?: string;
  description?: string;
  tags: string[];
  isVegetarian: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isDairyFree?: boolean;
  isNutFree?: boolean;
  spiceLevel: number;
  rating?: number;
  time?: string;
  calories?: number;
  protein?: string;
  ingredients?: string[];
};

export default function DishDetailPage() {
  const router = useRouter();
  const [selectedDish, setSelectedDish] = useState<ParsedDish | null>(null);
  const [allDishes, setAllDishes] = useState<ParsedDish[]>([]);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load data from sessionStorage
    const dishData = sessionStorage.getItem("selectedDish");
    const allDishesData = sessionStorage.getItem("parsedDishes");
    const ocrTextData = sessionStorage.getItem("ocrText");
    const detectedLangData = sessionStorage.getItem("detectedLanguage");

    if (dishData) {
      setSelectedDish(JSON.parse(dishData));
    }
    if (allDishesData) {
      setAllDishes(JSON.parse(allDishesData));
    }
    if (ocrTextData) {
      setOcrText(ocrTextData);
    }
    if (detectedLangData) {
      setDetectedLanguage(detectedLangData);
    }

    setIsLoading(false);

    // If no dish data, redirect to results
    if (!dishData) {
      router.push("/results");
    }
  }, [router]);

  const handleShareDish = () => {
    if (selectedDish) {
      console.log('Sharing dish:', selectedDish);
    }
  };

  const handleSimilarDishClick = (dish: ParsedDish) => {
    sessionStorage.setItem("selectedDish", JSON.stringify(dish));
    setSelectedDish(dish);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dish details...</p>
        </div>
      </div>
    );
  }

  if (!selectedDish) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No dish selected</p>
          <Button onClick={() => router.push("/results")}>
            Back to Results
          </Button>
        </div>
      </div>
    );
  }

  // Enhance dish data with OCR context
  const enhancedDish = enhanceDishWithOCR(selectedDish, ocrText || undefined, detectedLanguage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 z-20 shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/results")}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              ← Back to Menu
            </Button>
            <div className="flex items-center gap-2">
              {enhancedDish.restaurantInfo?.name && (
                <div className="text-sm text-gray-600">
                  📍 {enhancedDish.restaurantInfo.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Hero Image */}
      <DishImage 
        dish={enhancedDish} 
        className="h-72 sm:h-80" 
        priority={true}
      />

      {/* Main Content */}
      <div className="bg-white">
        {/* Dish Header */}
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {enhancedDish.translatedName || enhancedDish.originalName}
            </h1>
            
            {/* Original Language Name */}
            {enhancedDish.originalLanguageName && enhancedDish.originalLanguageName !== (enhancedDish.translatedName || enhancedDish.originalName) && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Original: </span>
                <span className="text-gray-700 font-medium">{enhancedDish.originalLanguageName}</span>
              </div>
            )}
            
            {/* Restaurant & Location Info */}
            {enhancedDish.restaurantInfo && (
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                {enhancedDish.restaurantInfo.cuisine && (
                  <span className="flex items-center gap-1">
                    🍽️ {enhancedDish.restaurantInfo.cuisine} Cuisine
                  </span>
                )}
                {enhancedDish.restaurantInfo.location && (
                  <span className="flex items-center gap-1">
                    📍 {enhancedDish.restaurantInfo.location}
                  </span>
                )}
              </div>
            )}

            {/* Enhanced Rating & Details */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">
                  {enhancedDish.rating || 4.5}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{enhancedDish.time || "15 min"}</span>
              </div>
              <div className="flex items-center gap-1">
                {enhancedDish.spiceLevel > 0 ? (
                  <>
                    {"🌶️".repeat(Math.min(enhancedDish.spiceLevel, 3))}
                    {enhancedDish.spiceLevel > 3 && "🔥"}
                  </>
                ) : (
                  <span className="text-gray-400 text-sm">😌 Mild</span>
                )}
              </div>
              {enhancedDish.confidence > 0.7 && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Verified</span>
                </div>
              )}
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              {enhancedDish.description ||
                `Delicious ${enhancedDish.originalName} prepared with authentic ingredients and traditional cooking methods.`}
            </p>
          </div>

          {/* Enhanced Nutrition Info */}
          <NutritionInfo dish={enhancedDish} className="mb-6" />

          {/* Enhanced Ingredients Section */}
          {enhancedDish.ingredients && enhancedDish.ingredients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                🥘 Ingredients
              </h3>
              <div className="flex flex-wrap gap-2">
                {enhancedDish.ingredients.map((ingredient: string) => (
                  <Badge
                    key={ingredient}
                    variant="outline"
                    className="px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                  >
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Allergens Section */}
          {enhancedDish.allergens && enhancedDish.allergens.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                ⚠️ Allergens
              </h3>
              <div className="flex flex-wrap gap-2">
                {enhancedDish.allergens.map((allergen: string) => (
                  <Badge
                    key={allergen}
                    variant="destructive"
                    className="px-3 py-1.5 text-sm bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  >
                    {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Please inform staff of any allergies before ordering
              </p>
            </div>
          )}

          {/* Enhanced Tags */}
          {enhancedDish.tags && enhancedDish.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🏷️ Tags</h3>
              <div className="flex flex-wrap gap-2">
                {enhancedDish.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1.5 text-sm hover:bg-gray-200 transition-colors">
                    {tag}
                  </Badge>
                ))}
                {enhancedDish.isVegetarian && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1.5 text-sm text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                  >
                    🌱 Vegetarian
                  </Badge>
                )}
                {enhancedDish.isVegan && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1.5 text-sm text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                  >
                    🌱 Vegan
                  </Badge>
                )}
                {enhancedDish.isGlutenFree && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1.5 text-sm text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                  >
                    🌾 Gluten-Free
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Similar Dishes Section */}
        <div className="px-4 sm:px-6">
          <SimilarDishes 
            currentDish={enhancedDish}
            allDishes={allDishes}
            onDishClick={handleSimilarDishClick}
            maxSuggestions={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-6 bg-white border-t border-gray-200 sticky bottom-0 z-10">
          <DishActionButtons 
            dish={enhancedDish}
            onShare={handleShareDish}
          />
        </div>
      </div>
    </div>
  );
}