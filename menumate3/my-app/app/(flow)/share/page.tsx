"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QRCodeSection } from "@/components/QRCodeSection";

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

export default function SharePage() {
  const router = useRouter();
  const [parsedDishes, setParsedDishes] = useState<ParsedDish[]>([]);
  const [ocrText, setOcrText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en");

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

    // If no data, redirect to results
    if (!dishesData) {
      router.push("/results");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/results")}
              className="text-gray-600"
            >
              ← Back to Menu
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              Share Menu
            </h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="p-4">
        <QRCodeSection
          dishes={parsedDishes}
          originalText={ocrText}
          translatedText={translatedText}
          detectedLanguage={detectedLanguage}
          restaurantName="Restaurant"
        />
      </div>
    </div>
  );
}