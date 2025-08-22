"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProcessingScreen } from "@/components/ProcessingScreen";

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

  useEffect(() => {
    // Get the image from sessionStorage
    const imageData = sessionStorage.getItem("menuImage");
    if (imageData) {
      // Convert base64 back to File
      fetch(imageData)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "menu-image.jpg", { type: "image/jpeg" });
          setMenuImage(file);
        });
    } else {
      // No image data, redirect to capture
      router.push("/capture");
    }
  }, [router]);

  const handleComplete = (dishes: ParsedDish[], ocrText: string, detectedLanguage: string) => {
    // Store results and navigate to results page
    sessionStorage.setItem("parsedDishes", JSON.stringify(dishes));
    sessionStorage.setItem("ocrText", ocrText);
    sessionStorage.setItem("detectedLanguage", detectedLanguage);
    router.push("/results");
  };

  const handleRetakePhoto = () => {
    router.push("/capture");
  };

  return (
    <ProcessingScreen
      menuImage={menuImage}
      onComplete={handleComplete}
      onRetakePhoto={handleRetakePhoto}
    />
  );
}