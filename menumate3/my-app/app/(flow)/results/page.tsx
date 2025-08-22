"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResultsScreen } from "@/components/ResultsScreen";
import { getLanguageName } from "@/utils/languages";

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

export default function ResultsPage() {
  const router = useRouter();
  const [parsedDishes, setParsedDishes] = useState<ParsedDish[]>([]);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load data from sessionStorage
    const dishesData = sessionStorage.getItem("parsedDishes");
    const ocrTextData = sessionStorage.getItem("ocrText");
    const translatedTextData = sessionStorage.getItem("translatedText");
    const detectedLangData = sessionStorage.getItem("detectedLanguage");

    if (dishesData) {
      setParsedDishes(JSON.parse(dishesData));
    }
    if (ocrTextData) {
      setOcrText(ocrTextData);
    }
    if (translatedTextData) {
      setTranslatedText(translatedTextData);
    }
    if (detectedLangData) {
      setDetectedLanguage(detectedLangData);
    }

    setIsLoading(false);

    // If no data, redirect to welcome
    if (!dishesData && !ocrTextData) {
      router.push("/welcome");
    }
  }, [router]);

  const handleDishClick = (dish: ParsedDish) => {
    sessionStorage.setItem("selectedDish", JSON.stringify(dish));
    router.push("/dish-detail");
  };

  const handleFiltersClick = () => {
    router.push("/filters");
  };

  const handleShareClick = () => {
    router.push("/share");
  };

  const handleTranslateClick = () => {
    router.push("/translate");
  };

  const handleRetakePhoto = () => {
    router.push("/capture");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // Extract restaurant name from the first dish that has restaurant info
  const dishWithRestaurant = parsedDishes.find(dish => 
    (dish as any).restaurantInfo?.name
  ) as any;
  const restaurantName = dishWithRestaurant?.restaurantInfo?.name;

  return (
    <ResultsScreen
      parsedDishes={parsedDishes}
      ocrText={ocrText}
      translatedText={translatedText}
      detectedLanguage={detectedLanguage}
      restaurantName={restaurantName}
      onDishClick={handleDishClick}
      onFiltersClick={handleFiltersClick}
      onShareClick={handleShareClick}
      onTranslateClick={handleTranslateClick}
      onRetakePhoto={handleRetakePhoto}
      getLanguageName={getLanguageName}
    />
  );
}