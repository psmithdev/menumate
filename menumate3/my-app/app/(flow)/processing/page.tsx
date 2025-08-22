"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProcessingScreen } from "@/components/ProcessingScreen";
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

export default function ProcessingPage() {
  const router = useRouter();
  const [menuImage, setMenuImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get the image from optimized storage
    const imageData = sessionStorage.getItem("menuImage");
    if (imageData) {
      // Convert base64 back to File with optimized loading
      fetch(imageData)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "menu-image.jpg", { type: "image/jpeg" });
          setMenuImage(file);
          setIsLoading(false);
        })
        .catch(() => {
          router.push("/capture");
        });
    } else {
      // No image data, redirect to capture
      router.push("/capture");
    }
  }, [router]);

  const handleComplete = (dishes: ParsedDish[], ocrText: string, detectedLanguage: string) => {
    // Store results using optimized storage and navigate to results page
    FlowStorage.setFlowData({
      parsedDishes: dishes,
      ocrText,
      detectedLanguage
    });
    
    // Small delay to ensure storage is complete
    setTimeout(() => {
      router.push("/results");
    }, 30);
  };

  const handleRetakePhoto = () => {
    router.push("/capture");
  };

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <LoadingTransition 
            key="preparing-image"
            isLoading={isLoading} 
            message="Preparing image..." 
          />
        )}
      </AnimatePresence>
      
      <ProcessingScreen
        menuImage={menuImage}
        onComplete={handleComplete}
        onRetakePhoto={handleRetakePhoto}
      />
    </>
  );
}