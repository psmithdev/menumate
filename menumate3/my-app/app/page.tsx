"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  Globe,
  Filter,
  Heart,
  Clock,
  Star,
  ChefHat,
  Leaf,
  Flame,
  CheckCircle,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { PhotoUpload } from "@/components/PhotoUpload";
import React, { useRef } from "react";
import { analyzeDish } from "@/utils/dishParser";
import {
  preprocessImage,
  analyzeImageQuality,
} from "@/utils/imagePreprocessor";
import { TranslationCache } from "@/utils/translationCache";
import {
  detectLanguage,
  getLanguageName,
} from "@/utils/languages";
import { parseThaiMenuLine, formatAllPrices } from "@/utils/thaiPriceParser";
import { QRCodeSection } from "@/components/QRCodeSection";
import { CartButton } from "@/components/CartButton";
import { DishCard } from "@/components/dish-card";

type Screen =
  | "welcome"
  | "photo"
  | "camera"
  | "processing"
  | "results"
  | "translate"
  | "dish-detail"
  | "filters"
  | "share";


type ParsedDish = {
  id: string;
  originalName: string;
  translatedName?: string;
  originalPrice: string;
  translatedPrice?: string;
  description?: string;
  tags: string[];
  isVegetarian: boolean;
  spiceLevel: number;
  rating?: number;
  time?: string;
  calories?: number;
  protein?: string;
  ingredients?: string[];
};

export default function MenuTranslatorDesign() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  
  // Debug logging for screen changes
  useEffect(() => {
    console.log('Screen changed to:', currentScreen);
  }, [currentScreen]);
  const [selectedDish, setSelectedDish] = useState<ParsedDish | null>(null);
  const [menuImage, setMenuImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [parsedDishes, setParsedDishes] = useState<ParsedDish[]>([]);
  const [, setPreviewUrl] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en");
  const [targetLanguage, setTargetLanguage] = useState<string>("en");

  // Filter states
  const [filters, setFilters] = useState({
    dietary: {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      dairyFree: false,
      nutFree: false,
    },
    maxSpiceLevel: 4,
    priceRange: { min: 5, max: 50 },
    sortBy: 'recommended' as 'recommended' | 'rating' | 'price' | 'time',
  });
  
  // Filtered dishes state
  const [filteredDishes, setFilteredDishes] = useState<ParsedDish[]>([]);

  // Enhanced function to extract price number from price string with multiple currency support
  const extractPriceNumber = useCallback((priceString: string): number => {
    if (!priceString || priceString === "Price not detected") return 0;
    
    // Enhanced regex to handle various price formats including currencies and Thai baht
    const priceMatch = priceString.match(/(?:[฿$€£¥₹₽]?\s?)?(\d{1,5}(?:[.,]\d{1,2})?)\s?(?:บาท|baht|dollars?|euros?|pounds?|yen|rupees?|฿|$|€|£|¥|₹|₽)?/i);
    
    if (priceMatch) {
      let price = parseFloat(priceMatch[1].replace(',', '.'));
      
      // Convert common currencies to USD equivalent for comparison
      // These are rough conversions for filter comparison purposes
      if (priceString.includes('฿') || priceString.includes('บาท') || priceString.includes('baht')) {
        price = price * 0.029; // THB to USD (approximate)
      } else if (priceString.includes('¥')) {
        price = price * 0.007; // JPY to USD (approximate)
      } else if (priceString.includes('€')) {
        price = price * 1.1; // EUR to USD (approximate)
      } else if (priceString.includes('£')) {
        price = price * 1.27; // GBP to USD (approximate)
      }
      // Default assumes USD or treats as USD equivalent
      
      return price;
    }
    
    return 0;
  }, []);

  // Function to filter and sort dishes based on current filters
  const applyFilters = useCallback((dishes: ParsedDish[]): ParsedDish[] => {
    // console.log('applyFilters called with:', dishes.length, 'dishes and filters:', filters);
    const filteredDishes = dishes.filter((dish) => {
      // Dietary filters - Use the new boolean properties directly (handle undefined)
      if (filters.dietary.vegetarian && !dish.isVegetarian) return false;
      if (filters.dietary.vegan && !dish.isVegan) return false;
      if (filters.dietary.glutenFree && !dish.isGlutenFree) return false;
      if (filters.dietary.dairyFree && !dish.isDairyFree) return false;
      if (filters.dietary.nutFree && !dish.isNutFree) return false;

      // Spice level filter
      if (dish.spiceLevel > filters.maxSpiceLevel) return false;

      // Price range filter
      const price = extractPriceNumber(dish.originalPrice);
      if (price > 0 && (price < filters.priceRange.min || price > filters.priceRange.max)) {
        return false;
      }

      return true;
    });

    // Sort the filtered dishes with enhanced sorting logic
    return filteredDishes.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          // Sort by rating, then by name for tie-breaking
          const ratingDiff = (b.rating || 4.0) - (a.rating || 4.0);
          return ratingDiff !== 0 ? ratingDiff : a.originalName.localeCompare(b.originalName);
        
        case 'price':
          // Sort by price, handling "Price not detected" items by putting them last
          const priceA = extractPriceNumber(a.originalPrice);
          const priceB = extractPriceNumber(b.originalPrice);
          if (priceA === 0 && priceB === 0) return a.originalName.localeCompare(b.originalName);
          if (priceA === 0) return 1; // Move "Price not detected" to end
          if (priceB === 0) return -1; // Move "Price not detected" to end
          return priceA - priceB;
        
        case 'time':
          // Sort by preparation time, then by rating
          const aTime = parseInt(a.time?.match(/\d+/)?.[0] || '15');
          const bTime = parseInt(b.time?.match(/\d+/)?.[0] || '15');
          const timeDiff = aTime - bTime;
          return timeDiff !== 0 ? timeDiff : (b.rating || 4.0) - (a.rating || 4.0);
        
        default: // recommended - intelligent sorting based on multiple factors
          // Sort by a combination of rating, spice level preference, and alphabetical
          let score = 0;
          
          // Factor in rating (higher is better)
          score += (b.rating || 4.0) - (a.rating || 4.0);
          
          // Factor in vegetarian preference if filter is active
          if (filters.dietary.vegetarian && a.isVegetarian !== b.isVegetarian) {
            score += a.isVegetarian ? 1 : -1;
          }
          
          // Factor in spice level preference (closer to max preference is better)
          const spiceDiffA = Math.abs(a.spiceLevel - filters.maxSpiceLevel);
          const spiceDiffB = Math.abs(b.spiceLevel - filters.maxSpiceLevel);
          score += (spiceDiffA - spiceDiffB) * 0.1;
          
          // Fall back to alphabetical for tie-breaking
          return score !== 0 ? score : a.originalName.localeCompare(b.originalName);
      }
    });
  }, [filters, extractPriceNumber]);

  // Update filtered dishes when parsedDishes or filters change
  useEffect(() => {
    if (parsedDishes.length > 0) {
      // console.log('Parsed dishes for filtering:', parsedDishes.map(d => ({...})));
      const filtered = applyFilters(parsedDishes);
      console.log('Filtering applied:', filtered.length, 'of', parsedDishes.length, 'dishes match current filters');
      setFilteredDishes(filtered);
    } else {
      setFilteredDishes([]);
    }
  }, [parsedDishes, filters, applyFilters]);

  // Enhanced error handling for OCR
  useEffect(() => {
    if (currentScreen === "processing" && menuImage) {
      setIsProcessing(true);
      setProcessingError(null);
      setRetryCount(0);

      const performOcr = async () => {
        try {
          const formData = new FormData();
          formData.append("image", menuImage);

          const res = await fetch("/api/ocr", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(
              errorData.error || `OCR failed with status ${res.status}`
            );
          }

          const data = await res.json();

          if (!data.text || data.text.trim().length === 0) {
            throw new Error(
              "No text was detected in the image. Please try a clearer photo."
            );
          }

          setOcrText(data.text);
          setCurrentScreen("results");
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to process image";
          setProcessingError(errorMessage);

          // Auto-retry for network errors (up to 2 times)
          if (
            retryCount < 2 &&
            (errorMessage.includes("network") || errorMessage.includes("fetch"))
          ) {
            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
              performOcr();
            }, 2000);
          }
        } finally {
          setIsProcessing(false);
        }
      };

      performOcr();
    }
  }, [currentScreen, menuImage, retryCount]);

  // Enhanced error handling for translation
  useEffect(() => {
    if (currentScreen === "translate" && ocrText) {
      setIsTranslating(true);
      setTranslationError(null);

      const performTranslation = async () => {
        try {
          // Check cache first
          const cachedResult = TranslationCache.get(ocrText, targetLanguage);
          if (cachedResult) {
            console.log("Using cached translation");
            setTranslatedText(cachedResult);
            setIsTranslating(false);
            return;
          }

          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: ocrText, targetLanguage }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(
              errorData.error || `Translation failed with status ${res.status}`
            );
          }

          const data = await res.json();

          if (!data.translatedText || data.translatedText.trim().length === 0) {
            throw new Error(
              "Translation returned empty result. Please try again."
            );
          }

          // Cache the translation
          TranslationCache.set(
            ocrText,
            data.translatedText,
            targetLanguage,
            data.confidence || 1.0
          );

          setTranslatedText(data.translatedText);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to translate text";
          setTranslationError(errorMessage);
        } finally {
          setIsTranslating(false);
        }
      };

      performTranslation();
    }
  }, [currentScreen, ocrText, targetLanguage]);

  // Function to parse OCR text into structured dishes
  const parseOcrText = (
    text: string,
    detectedLanguage: string = "en"
  ): ParsedDish[] => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const dishes: ParsedDish[] = [];

    // Use enhanced Thai price parsing for Thai language or fallback to legacy parsing
    const isThaiLanguage = detectedLanguage === "th" || detectedLanguage === "thai";
    
    // Additional filtering for Thai menus to remove common non-dish lines
    let filteredLines = lines;
    if (isThaiLanguage) {
      filteredLines = lines.filter((line, index) => {
        // Skip lines that are likely headers/footers
        if (index === 0 && line.match(/(?:ร้าน|restaurant|menu|เมนู)/i)) {
          return false;
        }
        
        // Skip lines that are just contact info or addresses
        if (line.match(/(?:tel|phone|โทร|address|ที่อยู่|facebook|line|www|http)/i)) {
          return false;
        }
        
        // Skip lines that are just times or dates
        if (line.match(/^\d{1,2}[:.-]\d{2}|(?:am|pm|โมง|open|close|เปิด|ปิด)$/i)) {
          return false;
        }
        
        // Skip very short lines that are likely not dishes
        if (line.length < 4) {
          return false;
        }
        
        return true;
      });
    }
    
    if (isThaiLanguage) {
      // Enhanced Thai price parsing
      console.log("Filtered lines for Thai parsing:", filteredLines);
      
      filteredLines.forEach((line, index) => {
        const parsedLine = parseThaiMenuLine(line);
        console.log(`Line ${index}: "${line}" -> isDish: ${parsedLine.isDish}, isValid: ${parsedLine.isValid}, dishName: "${parsedLine.dishName}"`);
        
        // Only process lines that are identified as dishes
        if (parsedLine.isDish && parsedLine.dishName) {
          const analysis = analyzeDish(parsedLine.dishName, detectedLanguage);
          
          // Handle multiple sizes by creating separate dishes or combining prices
          if (parsedLine.prices.length > 1) {
            // Create a single dish with formatted multi-size pricing
            const dish: ParsedDish = {
              id: `dish-${index}`,
              originalName: parsedLine.dishName,
              originalPrice: formatAllPrices(parsedLine.prices),
              translatedName: undefined,
              translatedPrice: undefined,
              description: `Delicious ${parsedLine.dishName} prepared with authentic ingredients`,
              tags: analysis.tags,
              isVegetarian: analysis.isVegetarian,
              isVegan: analysis.isVegan,
              isGlutenFree: analysis.isGlutenFree,
              isDairyFree: analysis.isDairyFree,
              isNutFree: analysis.isNutFree,
              spiceLevel: analysis.spiceLevel,
              rating: 4.5,
              time: analysis.cookingTime,
              calories: analysis.estimatedCalories,
              protein: analysis.estimatedProtein,
              ingredients: analysis.ingredients,
            };
            dishes.push(dish);
          } else if (parsedLine.prices.length === 1) {
            // Single price dish
            const dish: ParsedDish = {
              id: `dish-${index}`,
              originalName: parsedLine.dishName,
              originalPrice: parsedLine.prices[0].price,
              translatedName: undefined,
              translatedPrice: undefined,
              description: `Delicious ${parsedLine.dishName} prepared with authentic ingredients`,
              tags: analysis.tags,
              isVegetarian: analysis.isVegetarian,
              isVegan: analysis.isVegan,
              isGlutenFree: analysis.isGlutenFree,
              isDairyFree: analysis.isDairyFree,
              isNutFree: analysis.isNutFree,
              spiceLevel: analysis.spiceLevel,
              rating: 4.5,
              time: analysis.cookingTime,
              calories: analysis.estimatedCalories,
              protein: analysis.estimatedProtein,
              ingredients: analysis.ingredients,
            };
            dishes.push(dish);
          } else {
            // No price detected, but valid dish name
            const analysis = analyzeDish(parsedLine.dishName, detectedLanguage);
            const dish: ParsedDish = {
              id: `dish-${index}`,
              originalName: parsedLine.dishName,
              originalPrice: "Price not detected",
              translatedName: undefined,
              translatedPrice: undefined,
              description: `Delicious ${parsedLine.dishName} prepared with authentic ingredients`,
              tags: analysis.tags,
              isVegetarian: analysis.isVegetarian,
              isVegan: analysis.isVegan,
              isGlutenFree: analysis.isGlutenFree,
              isDairyFree: analysis.isDairyFree,
              isNutFree: analysis.isNutFree,
              spiceLevel: analysis.spiceLevel,
              rating: 4.5,
              time: analysis.cookingTime,
              calories: analysis.estimatedCalories,
              protein: analysis.estimatedProtein,
              ingredients: analysis.ingredients,
            };
            dishes.push(dish);
          }
        }
      });
    } else {
      // Legacy price parsing for non-Thai languages
      const priceRegex =
        /(?:[฿$€£])?\s?(\d{1,5}(?:[.,]\d{2})?)(?:\s?(?:บาท|baht|\.-|฿|$|€|£))?/i;
      const priceAtEndRegex =
        /(.+?)\s{1,3}(\d{1,5}(?:[.,]\d{2})?)(?:\s?(?:บาท|baht|\.-|฿|$|€|£))?$/i;
      const justNumberRegex = /^\d{1,5}(?:[.,]\d{2})?$/;

      let lastDish: ParsedDish | null = null;

      lines.forEach((line, index) => {
        // 1. Price at end of line (with or without currency/baht)
        let match = priceAtEndRegex.exec(line);
        if (match) {
          const name = match[1].trim();
          const price = match[2] + (line.includes("บาท") ? " บาท" : "");
          const analysis = analyzeDish(name, detectedLanguage);
          const dish: ParsedDish = {
            id: `dish-${index}`,
            originalName: name,
            originalPrice: price,
            translatedName: undefined,
            translatedPrice: undefined,
            description: `Delicious ${name} prepared with authentic ingredients`,
            tags: analysis.tags,
            isVegetarian: analysis.isVegetarian,
            isVegan: analysis.isVegan,
            isGlutenFree: analysis.isGlutenFree,
            isDairyFree: analysis.isDairyFree,
            isNutFree: analysis.isNutFree,
            spiceLevel: analysis.spiceLevel,
            rating: 4.5,
            time: analysis.cookingTime,
            calories: analysis.estimatedCalories,
            protein: analysis.estimatedProtein,
            ingredients: analysis.ingredients,
          };
          dishes.push(dish);
          lastDish = dish;
          return;
        }

        // 2. Price at start of line (rare, but possible)
        match = priceRegex.exec(line);
        if (match && line.startsWith(match[0])) {
          // If previous dish exists, assign price to it
          if (lastDish && lastDish.originalPrice === "Price not detected") {
            lastDish.originalPrice =
              match[1] + (line.includes("บาท") ? " บาท" : "");
          }
          return;
        }

        // 3. Line is just a number (likely a price for previous dish)
        if (justNumberRegex.test(line)) {
          if (lastDish && lastDish.originalPrice === "Price not detected") {
            lastDish.originalPrice = line;
          }
          return;
        }

        // 4. Line contains only a name (or price not detected)
        const analysis = analyzeDish(line, detectedLanguage);
        const dish: ParsedDish = {
          id: `dish-${index}`,
          originalName: line,
          originalPrice: "Price not detected",
          translatedName: undefined,
          translatedPrice: undefined,
          description: `Delicious ${line} prepared with authentic ingredients`,
          tags: analysis.tags,
          isVegetarian: analysis.isVegetarian,
          isVegan: analysis.isVegan,
          isGlutenFree: analysis.isGlutenFree,
          isDairyFree: analysis.isDairyFree,
          isNutFree: analysis.isNutFree,
          spiceLevel: analysis.spiceLevel,
          rating: 4.5,
          time: analysis.cookingTime,
          calories: analysis.estimatedCalories,
          protein: analysis.estimatedProtein,
          ingredients: analysis.ingredients,
        };
        dishes.push(dish);
        lastDish = dish;
      });
    }

    return dishes;
  };

  // Update parsed dishes when OCR text changes
  useEffect(() => {
    if (ocrText) {
      // Detect language from OCR text
      const detected = detectLanguage(ocrText);
      console.log(
        "Detected language:",
        detected,
        "for text sample:",
        ocrText.substring(0, 100)
      );
      setDetectedLanguage(detected);

      // Set target language to English by default
      setTargetLanguage("en");

      const dishes = parseOcrText(ocrText, detected);
      console.log("Parsed dishes:", dishes);

      // If no dishes were parsed, create a fallback dish from the OCR text
      if (dishes.length === 0 && ocrText.trim()) {
        console.log("No dishes parsed, creating fallback dish");
        const fallbackDish: ParsedDish = {
          id: "fallback-dish",
          originalName: ocrText.split("\n")[0] || "Menu Item",
          originalPrice: "Price not detected",
          description: "Menu item from your uploaded image",
          tags: ["Menu Item"],
          isVegetarian: false,
          isVegan: false,
          isGlutenFree: false,
          isDairyFree: false,
          isNutFree: false,
          spiceLevel: 0,
          rating: 4.0,
          time: "15 min",
          calories: 300,
          protein: "20g",
          ingredients: ["Ingredients not specified"],
        };
        setParsedDishes([fallbackDish]);
      } else {
        setParsedDishes(dishes);
      }
    }
  }, [ocrText]);

  // Update dishes when translation is complete
  useEffect(() => {
    if (translatedText) {
      const translatedLines = translatedText
        .split("\n")
        .filter((line) => line.trim());
      
      // Use functional update to avoid dependency on parsedDishes
      setParsedDishes(currentDishes => {
        if (currentDishes.length === 0) return currentDishes;
        
        return currentDishes.map((dish, index) => {
          const translatedLine = translatedLines[index];
          if (translatedLine) {
            const priceMatch = translatedLine.match(/[¥$€£]\s*(\d+(?:\.\d{2})?)/);
            const translatedName = priceMatch
              ? translatedLine.replace(priceMatch[0], "").trim()
              : translatedLine.trim();
            const translatedPrice = priceMatch
              ? priceMatch[0]
              : dish.originalPrice;

            return {
              ...dish,
              translatedName,
              translatedPrice,
            };
          }
          return dish;
        });
      });
    }
  }, [translatedText]);

  if (currentScreen === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-pink-400 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-yellow-300 rounded-full blur-lg"></div>
          <div className="absolute bottom-32 left-20 w-40 h-40 bg-white rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-white">
          {/* Logo/Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mb-4">
              <ChefHat className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Hero Text */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Discover Every
              <br />
              <span className="text-yellow-200">Delicious Detail</span>
            </h1>
            <p className="text-lg opacity-90 leading-relaxed max-w-sm">
              Snap any menu and instantly understand every dish with smart
              translations and personalized recommendations
            </p>
          </div>

          {/* Features Preview */}
          <div className="flex gap-6 mb-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-2">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-sm opacity-80">Instant Scan</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-2">
                <Globe className="w-6 h-6" />
              </div>
              <p className="text-sm opacity-80">Smart Translate</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm opacity-80">Personalized</p>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => setCurrentScreen("camera")}
            className="w-full max-w-sm h-14 bg-white text-orange-500 hover:bg-gray-50 rounded-2xl text-lg font-semibold shadow-xl"
          >
            Start Exploring
          </Button>

          {/* Bottom indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="w-1 h-8 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === "camera") {
    // File input ref and handler
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setCameraError("Please select a valid image file.");
        setPreviewUrl(null);
        return;
      }

      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setCameraError("Image must be less than 5MB.");
        setPreviewUrl(null);
        return;
      }

      setCameraError(null);
      setPreviewUrl(URL.createObjectURL(file));

      // Analyze image quality and preprocess if needed
      try {
        const quality = await analyzeImageQuality(file);
        let processedFile = file;

        if (quality.needsPreprocessing) {
          console.log("Image needs preprocessing:", quality);
          processedFile = await preprocessImage(file, {
            contrast: quality.isLowContrast ? 1.3 : 1.1,
            brightness: quality.isDark ? 1.2 : 1.0,
            sharpen: quality.isBlurry,
            denoise: true,
            autoRotate: true,
          });
        }

        setMenuImage(processedFile);
        setCurrentScreen("processing");
      } catch (error) {
        console.error("Image preprocessing failed:", error);
        // Fallback to original file
        setMenuImage(file);
        setCurrentScreen("processing");
      }
    };

    const triggerFileInput = () => {
      fileInputRef.current?.click();
    };

    return (
      <div className="min-h-screen bg-black relative">
        {/* Camera Viewfinder */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50">
          <div className="flex items-center justify-center h-full">
            <div className="relative">
              {/* Viewfinder Frame */}
              <div className="w-80 h-96 border-2 border-white/50 rounded-3xl relative">
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg"></div>

                {/* Center crosshair */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-8 border border-white/70 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Helper Text */}
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                <p className="text-white/80 text-sm">
                  Position menu within frame
                </p>
                <p className="text-white/60 text-xs mt-1">
                  Ensure good lighting for best results
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentScreen("welcome")}
              className="text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-lg rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white text-sm">Ready</span>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
          <div className="flex items-center justify-center gap-8">
            {/* Gallery Button (Upload) */}
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg text-white hover:bg-white/30"
              onClick={triggerFileInput}
            >
              <Upload className="w-5 h-5" />
            </Button>

            {/* Capture Button (Camera) */}
            <Button
              className="w-20 h-20 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg"
              onClick={triggerFileInput}
            >
              <Camera className="w-10 h-10" />
            </Button>

            {/* Flash Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg text-white hover:bg-white/30"
            >
              <Sparkles className="w-5 h-5" />
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          {cameraError && (
            <div className="text-red-500 text-center mt-2">{cameraError}</div>
          )}
          {/* Tips */}
          <div className="mt-6 text-center">
            <p className="text-white/70 text-xs">
              💡 Tip: Hold steady and ensure menu text is clearly visible
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === "photo") {
    return (
      <PhotoUpload
        onImageSelected={(file) => {
          setMenuImage(file);
          setCurrentScreen("processing");
        }}
      />
    );
  }

  if (currentScreen === "processing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
        <div className="text-center text-white max-w-sm">
          {/* Animated Logo */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <ChefHat className="w-12 h-12 text-white" />
            </div>

            {/* Processing Animation */}
            {isProcessing && (
              <div className="flex justify-center gap-2 mb-6">
                <div
                  className="w-3 h-3 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-3 h-3 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-3 h-3 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            )}
          </div>

          {/* Processing Steps */}
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold mb-6">Analyzing Your Menu</h2>

            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-lg rounded-2xl">
              <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <span className="text-left">Scanning image quality</span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-lg rounded-2xl">
              <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center animate-spin">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
              <span className="text-left">Extracting text from menu</span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-lg rounded-2xl opacity-50">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-left">Translating dishes</span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-lg rounded-2xl opacity-50">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-left">Finding perfect matches</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 mb-4">
            <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full w-1/2 animate-pulse"></div>
          </div>

          {processingError && (
            <div className="text-red-400 text-sm mb-4">{processingError}</div>
          )}
          <p className="text-white/70 text-sm">
            This usually takes 10-15 seconds
          </p>

          {/* Auto advance after delay */}
          <div className="mt-8">
            <Button
              onClick={() => setCurrentScreen("results")}
              variant="ghost"
              className="text-white/50 text-sm hover:text-white"
            >
              Skip to results →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === "results") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-10">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Menu Discovered
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{filteredDishes.length} dishes found {filteredDishes.length !== parsedDishes.length && `(${parsedDishes.length} total)`}</span>
                  {detectedLanguage && (
                    <Badge variant="outline" className="text-xs">
                      <Globe className="w-3 h-3 mr-1" />
                      {getLanguageName(detectedLanguage)}
                    </Badge>
                  )}
                  {translatedText && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-green-100 text-green-700"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Translated
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentScreen("share")}
                  className="rounded-full"
                  disabled={filteredDishes.length === 0}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Filter button clicked, navigating to filters screen');
                    setCurrentScreen("filters");
                  }}
                  className="rounded-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Badge
                variant={filters.dietary.vegetarian ? "secondary" : "outline"}
                className={`whitespace-nowrap cursor-pointer ${
                  filters.dietary.vegetarian 
                    ? "bg-orange-100 text-orange-700 border-orange-200" 
                    : "hover:bg-gray-100"
                }`}
                onClick={() => 
                  setFilters(prev => ({
                    ...prev,
                    dietary: { ...prev.dietary, vegetarian: !prev.dietary.vegetarian }
                  }))
                }
              >
                <Leaf className="w-3 h-3 mr-1" />
                Vegetarian
              </Badge>
              <Badge 
                variant={filters.maxSpiceLevel < 4 ? "secondary" : "outline"}
                className={`whitespace-nowrap cursor-pointer ${
                  filters.maxSpiceLevel < 4
                    ? "bg-red-100 text-red-700 border-red-200"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => 
                  setFilters(prev => ({
                    ...prev,
                    maxSpiceLevel: prev.maxSpiceLevel < 4 ? 4 : 2
                  }))
                }
              >
                <Flame className="w-3 h-3 mr-1" />
                Spicy
              </Badge>
              <Badge 
                variant={filters.priceRange.max <= 20 ? "secondary" : "outline"}
                className={`whitespace-nowrap cursor-pointer ${
                  filters.priceRange.max <= 20
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => 
                  setFilters(prev => ({
                    ...prev,
                    priceRange: { ...prev.priceRange, max: prev.priceRange.max <= 20 ? 50 : 20 }
                  }))
                }
              >
                Under $20
              </Badge>
              <Badge 
                variant={filters.sortBy === 'time' ? "secondary" : "outline"}
                className={`whitespace-nowrap cursor-pointer ${
                  filters.sortBy === 'time'
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => 
                  setFilters(prev => ({
                    ...prev,
                    sortBy: prev.sortBy === 'time' ? 'recommended' : 'time'
                  }))
                }
              >
                Quick ({"<"}20min)
              </Badge>
            </div>
          </div>
        </div>

        {/* OCR Results Section */}
        {ocrText && (
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                {translatedText ? "Original vs Translated" : "Extracted Text"}
              </h2>
              {!translatedText && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentScreen("translate")}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Translate →
                </Button>
              )}
            </div>

            {translatedText ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    Original ({getLanguageName(detectedLanguage)})
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                      {ocrText}
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Translated (English)
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                      {translatedText}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {ocrText}
                </pre>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              {translatedText
                ? "Side-by-side comparison of original and translated text."
                : 'This is the raw text extracted from your menu image. Click "Translate" to convert it to English.'}
            </p>
          </div>
        )}

        {/* Dishes Grid */}
        <div className="p-4">
          {filteredDishes.length === 0 ? (
            <div className="text-center py-8">
              {parsedDishes.length === 0 ? (
                <>
                  <p className="text-gray-500 mb-4">
                    No dishes found in the OCR text.
                  </p>
                  <p className="text-sm text-gray-400">
                    Debug info: {parsedDishes.length} dishes parsed
                  </p>
                  {ocrText && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-blue-600">
                        View OCR Text
                      </summary>
                      <pre className="text-xs text-gray-600 mt-2 bg-gray-100 p-2 rounded whitespace-pre-wrap">
                        {ocrText}
                      </pre>
                    </details>
                  )}
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">
                    No dishes match your current filters.
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Found {parsedDishes.length} dishes total, but none match your preferences.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentScreen("filters")}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Adjust Filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDishes.map((dish) => (
                <DishCard 
                  key={dish.id} 
                  dish={dish} 
                  onClick={() => {
                    console.log('Dish clicked:', dish.originalName);
                    setSelectedDish(dish);
                    setCurrentScreen("dish-detail");
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-4 z-50">
          <CartButton />
          <Button
            onClick={() => setCurrentScreen("camera")}
            className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 shadow-2xl"
          >
            <Camera className="w-6 h-6" />
          </Button>
        </div>
      </div>
    );
  }

  if (currentScreen === "translate") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-10">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Translation
                </h1>
                <p className="text-gray-600 text-sm">
                  Converting your menu to English
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentScreen("results")}
                className="rounded-full"
              >
                ← Back
              </Button>
            </div>
          </div>
        </div>

        {/* Translation Content */}
        <div className="p-4 space-y-6">
          {/* Original Text */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              Original Text
            </h2>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                {ocrText}
              </pre>
            </div>
          </div>

          {/* Translation Status */}
          {isTranslating && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="flex justify-center gap-2 mb-4">
                  <div
                    className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <p className="text-gray-600">Translating to English...</p>
              </div>
            </div>
          )}

          {/* Translated Text */}
          {translatedText && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-500" />
                Translated Text
              </h2>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {translatedText}
                </pre>
              </div>
              <div className="mt-4 flex gap-3">
                <Button
                  onClick={() => setCurrentScreen("results")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Continue to Results
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTranslatedText(null);
                    setCurrentScreen("translate");
                  }}
                >
                  Retranslate
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {translationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{translationError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentScreen("translate")}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentScreen === "dish-detail" && selectedDish) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-10">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentScreen("results")}
                className="text-gray-600"
              >
                ← Back to Menu
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600">
                <Heart className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative h-80">
          <Image
            src={"/placeholder.svg"}
            alt={selectedDish.originalName}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2">
            <span className="font-bold text-orange-600 text-lg">
              {selectedDish.translatedPrice || selectedDish.originalPrice}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-white">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedDish.translatedName || selectedDish.originalName}
            </h1>
            <p className="text-gray-500 mb-4">{selectedDish.originalName}</p>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">
                  {selectedDish.rating || 4.5}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{selectedDish.time || "15 min"}</span>
              </div>
              <div className="flex items-center gap-1">
                {"🌶️".repeat(selectedDish.spiceLevel || 0)}
                {selectedDish.spiceLevel === 0 && (
                  <span className="text-gray-400 text-sm">Mild</span>
                )}
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              {selectedDish.description ||
                `Delicious ${selectedDish.originalName} prepared with authentic ingredients.`}
            </p>
          </div>

          {/* Nutrition Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Calories</p>
              <p className="font-semibold">{selectedDish.calories || 300}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Protein</p>
              <p className="font-semibold">{selectedDish.protein || "20g"}</p>
            </div>
          </div>

          {/* Ingredients */}
          {selectedDish.ingredients && selectedDish.ingredients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Ingredients
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedDish.ingredients.map((ingredient: string) => (
                  <Badge
                    key={ingredient}
                    variant="outline"
                    className="px-3 py-1"
                  >
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {selectedDish.tags && selectedDish.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {selectedDish.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1">
                    {tag}
                  </Badge>
                ))}
                {selectedDish.isVegetarian && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1 text-green-600 border-green-200"
                  >
                    <Leaf className="w-3 h-3 mr-1" />
                    Vegetarian
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <Button className="flex-1 bg-orange-500 hover:bg-orange-600">
              Add to Order
            </Button>
            <Button variant="outline" className="flex-1">
              Share Dish
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === "filters") {
    console.log('Rendering filters screen with current filters:', filters);
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentScreen("results")}
              className="text-gray-600"
            >
              Cancel
            </Button>
            <h1 className="text-lg font-semibold">Filters & Preferences</h1>
            <Button
              onClick={() => setCurrentScreen("results")}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 rounded-full"
            >
              Apply ({filteredDishes.length})
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Dietary Preferences */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dietary Preferences
            </h3>
            <div className="space-y-4">
              {[
                { label: "Vegetarian", icon: "🥬", key: "vegetarian" as const },
                { label: "Vegan", icon: "🌱", key: "vegan" as const },
                { label: "Gluten-Free", icon: "🌾", key: "glutenFree" as const },
                { label: "Dairy-Free", icon: "🥛", key: "dairyFree" as const },
                { label: "Nut-Free", icon: "🥜", key: "nutFree" as const },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium text-gray-900">
                      {item.label}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !filters.dietary[item.key];
                      console.log(`Filter ${item.key} changed to:`, newValue);
                      setFilters(prev => {
                        const newFilters = {
                          ...prev,
                          dietary: { ...prev.dietary, [item.key]: newValue }
                        };
                        console.log('New filter state:', newFilters);
                        return newFilters;
                      });
                    }}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                      filters.dietary[item.key] 
                        ? 'bg-orange-500' 
                        : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      filters.dietary[item.key] ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Spice Level */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Maximum Spice Level
            </h3>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl">😌</span>
                <span className="text-2xl">🌶️</span>
                <span className="text-2xl">🌶️🌶️</span>
                <span className="text-2xl">🌶️🌶️🌶️</span>
                <span className="text-2xl">🔥</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                value={filters.maxSpiceLevel}
                onChange={(e) => 
                  setFilters(prev => ({
                    ...prev,
                    maxSpiceLevel: parseInt(e.target.value)
                  }))
                }
                className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Mild</span>
                <span>Very Spicy</span>
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Price Range
            </h3>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-gray-900">${filters.priceRange.min}</span>
                <span className="font-semibold text-gray-900">${filters.priceRange.max}+</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={filters.priceRange.max}
                onChange={(e) => 
                  setFilters(prev => ({
                    ...prev,
                    priceRange: { ...prev.priceRange, max: parseInt(e.target.value) }
                  }))
                }
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sort By
            </h3>
            <div className="space-y-2">
              {[
                { label: "Recommended for you", icon: "⭐", value: "recommended" as const },
                { label: "Highest rated", icon: "👍", value: "rating" as const },
                { label: "Price: Low to high", icon: "💰", value: "price" as const },
                { label: "Preparation time", icon: "⏱️", value: "time" as const },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={() => 
                    setFilters(prev => ({
                      ...prev,
                      sortBy: item.value
                    }))
                  }
                  className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-colors ${
                    filters.sortBy === item.value
                      ? "bg-orange-50 border-2 border-orange-200"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span
                    className={`font-medium ${
                      filters.sortBy === item.value ? "text-orange-700" : "text-gray-900"
                    }`}
                  >
                    {item.label}
                  </span>
                  {filters.sortBy === item.value && (
                    <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            onClick={() => {
              console.log('Reset filters clicked');
              setFilters({
                dietary: {
                  vegetarian: false,
                  vegan: false,
                  glutenFree: false,
                  dairyFree: false,
                  nutFree: false,
                },
                maxSpiceLevel: 4,
                priceRange: { min: 5, max: 50 },
                sortBy: 'recommended',
              });
            }}
            className="w-full h-12 rounded-2xl border-gray-300 text-gray-600 bg-transparent"
          >
            Reset All Filters
          </Button>
        </div>
      </div>
    );
  }

  if (currentScreen === "share") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-10">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentScreen("results")}
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
            originalText={ocrText || ""}
            translatedText={translatedText || ""}
            detectedLanguage={detectedLanguage}
            restaurantName="Restaurant"
          />
        </div>
      </div>
    );
  }

  return null;
}
