"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResultsScreen } from "@/components/ResultsScreen";
import { getLanguageName } from "@/utils/languages";
import { FlowStorage } from "@/utils/flowStorage";
import { LoadingTransition } from "@/components/LoadingTransition";
import { AnimatePresence } from "framer-motion";

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
    // Load data from optimized storage
    const flowData = FlowStorage.getFlowData();
    
    if (flowData.parsedDishes) {
      const dishes = typeof flowData.parsedDishes === 'string' 
        ? JSON.parse(flowData.parsedDishes) 
        : flowData.parsedDishes;
      setParsedDishes(dishes);
    }
    if (flowData.ocrText) {
      setOcrText(flowData.ocrText);
    }
    if (flowData.translatedText) {
      setTranslatedText(flowData.translatedText);
    }
    if (flowData.detectedLanguage) {
      setDetectedLanguage(flowData.detectedLanguage);
    }

    setIsLoading(false);

    // If no data, redirect to welcome
    if (!flowData.parsedDishes && !flowData.ocrText) {
      router.push("/welcome");
    }
  }, [router]);

  const handleDishClick = (dish: ParsedDish) => {
    FlowStorage.setSelectedDish(dish);
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
      <LoadingTransition 
        isLoading={true} 
        message="Loading results..." 
      />
    );
  }

  // Extract restaurant name from the first dish that has restaurant info
  const dishWithRestaurant = parsedDishes.find(dish => 
    (dish as ParsedDish & { restaurantInfo?: { name: string } }).restaurantInfo?.name
  ) as ParsedDish & { restaurantInfo?: { name: string } } | undefined;
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