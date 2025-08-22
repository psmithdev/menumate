"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRandomFoodTip } from "@/utils/foodTips";
import { parseMenuWithAI } from "@/utils/smartMenuParser";
import { parseMenuWithGPT4 } from "@/utils/smartMenuParserGPT4";
import { useRouter } from "next/navigation";

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

type ProcessingStats = {
  imageSize: string;
  ocrTime: number;
  dishesFound: number;
  confidence: number;
};

interface ProcessingScreenProps {
  menuImage?: File | null;
  onComplete: (dishes: ParsedDish[], ocrText: string, detectedLanguage: string) => void;
  onRetakePhoto: () => void;
}

export function ProcessingScreen({ menuImage, onComplete, onRetakePhoto }: ProcessingScreenProps) {
  const router = useRouter();
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  const [previewDishes, setPreviewDishes] = useState<ParsedDish[]>([]);
  const [currentFoodTip, setCurrentFoodTip] = useState<string>("");
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle rotating food tips during processing
  useEffect(() => {
    if (isProcessing) {
      setCurrentFoodTip(getRandomFoodTip());
      
      const tipInterval = setInterval(() => {
        setCurrentFoodTip(getRandomFoodTip());
      }, 3000);
      
      return () => clearInterval(tipInterval);
    }
  }, [isProcessing]);

  // Smart parsing function with Google Cloud Vision (primary) and GPT-4o (fallback)
  const trySmartParsing = async (imageFile: File, useGPT4Fallback = false) => {
    try {
      if (useGPT4Fallback) {
        console.log("🔄 Trying GPT-4o fallback...");
        const result = await parseMenuWithGPT4(imageFile);
        console.log("✅ GPT-4o parsing result:", result);
        return result;
      } else {
        console.log("🚀 Using Google Cloud Vision + intelligent parsing...");
        const result = await parseMenuWithAI(imageFile);
        console.log("✅ Google Vision parsing result:", result);
        return result;
      }
    } catch (error) {
      console.error("❌ Smart parsing failed:", error);
      return null;
    }
  };

  useEffect(() => {
    if (menuImage) {
      performOcr();
    }
  }, [menuImage]);

  const performOcr = async () => {
    if (!menuImage) return;
    
    setIsProcessing(true);
    setProcessingError(null);
    setProcessingProgress(0);
    setProcessingStats(null);
    setPreviewText('');
    setPreviewDishes([]);

    try {
      // Step 1: Image preprocessing (0-20%)
      setProcessingProgress(5);
      const imageSizeMB = (menuImage.size / (1024 * 1024)).toFixed(2);
      setProcessingStats({ imageSize: `${imageSizeMB}MB`, ocrTime: 0, dishesFound: 0, confidence: 0 });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingProgress(15);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 2: OCR Processing (20-70%)
      setProcessingProgress(25);
      const ocrStartTime = Date.now();
      
      // Try Google Cloud Vision + intelligent parsing first
      let smartResult = await trySmartParsing(menuImage, false);
      
      const ocrTime = Date.now() - ocrStartTime;
      setProcessingStats(prev => ({ ...prev!, ocrTime }));
      setProcessingProgress(50);
      
      // Show preview of extracted text if available
      if (smartResult && smartResult.dishes) {
        const previewText = smartResult.dishes.slice(0, 5)
          .map((dish: { name: string; price?: string }) => `${dish.name} ${dish.price || ''}`)
          .join('\n');
        setPreviewText(previewText);
      }

      // If Google Vision fails or returns few dishes, try GPT-4o fallback
      if (!smartResult || (smartResult.dishes && smartResult.dishes.length < 8)) {
        setProcessingProgress(60);
        console.log("🔄 Google Vision result insufficient, trying GPT-4o fallback...");
        smartResult = await trySmartParsing(menuImage, true);
      }

      if (smartResult) {
        // Step 3: Dish analysis and enhancement (70-90%)
        setProcessingProgress(75);
        
        const dishCount = smartResult.dishes.length;
        setProcessingStats(prev => ({ ...prev!, dishesFound: dishCount, confidence: smartResult.confidence }));
        
        // Show preview of first few dishes
        const previewDishes = smartResult.dishes.slice(0, 3).map(
          (dish: any, index: number) => ({
            id: `preview-dish-${index}`,
            originalName: dish.name,
            originalPrice: dish.price || "Price not detected",
            translatedName: undefined,
            translatedPrice: undefined,
            description: `${dish.category ? `${dish.category.charAt(0).toUpperCase() + dish.category.slice(1)} - ` : ""}${dish.name}`,
            tags: [dish.category || "dish"].filter(Boolean),
            isVegetarian: dish.isVegetarian || false,
            isVegan: false,
            isGlutenFree: false,
            isDairyFree: false,
            isNutFree: false,
            spiceLevel: dish.spiceLevel || 0,
            rating: 4.5,
            time: "15 min",
            calories: 300,
            protein: "15g",
            ingredients: [],
          })
        );
        setPreviewDishes(previewDishes);
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Convert smart result to ParsedDish format
        const dishes = smartResult.dishes.map((dish: any, index: number) => ({
          id: `smart-dish-${index}`,
          originalName: dish.name,
          originalPrice: dish.price || "Price not detected",
          translatedName: undefined,
          translatedPrice: undefined,
          description: `${dish.category ? `${dish.category.charAt(0).toUpperCase() + dish.category.slice(1)} - ` : ""}${dish.name}`,
          tags: [dish.category || "dish"].filter(Boolean),
          isVegetarian: dish.isVegetarian || false,
          isVegan: false,
          isGlutenFree: false,
          isDairyFree: false,
          isNutFree: false,
          spiceLevel: dish.spiceLevel || 0,
          rating: 4.5,
          time: "15 min",
          calories: 300,
          protein: "15g",
          ingredients: [],
        }));

        // Step 4: Finalization (90-100%)
        setProcessingProgress(90);
        
        // Set OCR text for translation system compatibility
        const combinedText = smartResult.dishes
          .map((dish: { name: string; price?: string }) => `${dish.name} ${dish.price || ""}`)
          .join("\n");

        setProcessingProgress(100);
        
        // Brief pause to show completion
        await new Promise(resolve => setTimeout(resolve, 500));
        
        onComplete(dishes, combinedText, smartResult.language);
        return;
      }

      // Fallback to traditional OCR
      setProcessingProgress(30);
      
      const formData = new FormData();
      formData.append("image", menuImage);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `OCR failed with status ${res.status}`);
      }

      const data = await res.json();
      
      setProcessingProgress(80);
      setProcessingStats(prev => ({ ...prev!, ocrTime: data.processingTime || 0, confidence: data.confidence || 0 }));
      
      const textPreview = data.text.split('\n').slice(0, 5).join('\n');
      setPreviewText(textPreview);

      if (!data.text || data.text.trim().length === 0) {
        throw new Error("No text was detected in the image. Please try a clearer photo.");
      }

      setProcessingProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      onComplete([], data.text, "en");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process image";
      setProcessingError(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Calculate estimated time remaining
  const getEstimatedTime = () => {
    if (processingProgress < 25) return 8;
    if (processingProgress < 50) return 6;
    if (processingProgress < 75) return 3;
    if (processingProgress < 95) return 1;
    return 0;
  };

  // Check if confidence is low and should show retake prompt
  const shouldShowRetakePrompt = processingStats?.confidence && processingStats.confidence < 0.9 && processingProgress > 80;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-pink-500 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <motion.div
          className="absolute -top-10 -left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"
          animate={{
            y: [0, 30, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-32 right-20 w-24 h-24 bg-white/5 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="text-center text-white max-w-sm relative z-10">
        {/* Chef Animation */}
        <div className="mb-10">
          <motion.div
            className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChefHat className="w-10 h-10 text-white" />
          </motion.div>

          {/* Cooking indicator */}
          {(isProcessing) && (
            <motion.div
              className="flex justify-center gap-1 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="w-2 h-2 bg-yellow-300 rounded-full"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 bg-yellow-300 rounded-full"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
              <motion.div
                className="w-2 h-2 bg-yellow-300 rounded-full"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
              />
            </motion.div>
          )}
        </div>

        {/* Header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-4">Analyzing Your Menu</h2>
          <div className="text-lg font-medium text-white/90 mb-2">
            {getEstimatedTime() > 0 ? `~${getEstimatedTime()}s remaining` : "Almost ready!"}
          </div>
        </motion.div>

        {/* Food Tips */}
        <AnimatePresence mode="wait">
          <motion.div
            className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-8 min-h-[60px] flex items-center justify-center"
            key={currentFoodTip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-white/90 text-sm leading-relaxed text-center">
              💡 {currentFoodTip || getRandomFoodTip()}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Current Step Display */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-white/80 text-sm mb-3">
            {processingProgress < 30 ? 'Analyzing your image...' :
             processingProgress < 70 ? 'Extracting menu text...' :
             processingProgress < 95 ? 'Finding dishes...' :
             'Almost done!'}
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-2 mb-8 overflow-hidden">
          <motion.div
            className="bg-white h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${processingProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        
        {/* Progress Percentage */}
        <div className="text-white/70 text-sm mb-8">
          {processingProgress}% complete
        </div>

        {/* Stats */}
        {processingStats && processingStats.dishesFound > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-white/70 text-sm">
              Found {processingStats.dishesFound} menu items
            </div>
          </motion.div>
        )}

        {/* Low Confidence Retake Prompt */}
        <AnimatePresence>
          {shouldShowRetakePrompt && (
            <motion.div
              className="bg-yellow-500/30 border border-yellow-400/50 backdrop-blur-lg rounded-xl p-4 mb-4"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="text-yellow-100 mb-3">
                <div className="font-semibold flex items-center gap-2">
                  📸 Photo unclear — want to retake?
                </div>
                <div className="text-sm text-yellow-200 mt-1">
                  Confidence is {Math.round((processingStats?.confidence || 0) * 100)}%. Better lighting might improve results.
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={onRetakePhoto}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-2 rounded-lg"
                >
                  📷 Retake Photo
                </Button>
                <Button
                  onClick={() => {}}
                  variant="ghost"
                  className="text-yellow-100 hover:text-white text-sm"
                >
                  Continue Anyway
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {processingError && (
            <motion.div
              className="bg-red-500/30 border border-red-400/50 rounded-xl p-4 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="text-red-200 text-sm">{processingError}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Preview */}
        <AnimatePresence>
          {(previewText || previewDishes.length > 0) && processingProgress > 40 && (
            <motion.div
              className="mt-6 bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="text-sm text-white/80 mb-3 flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                🔍 Live Preview
              </div>
              
              {previewDishes.length > 0 ? (
                <div className="space-y-2 text-left">
                  {previewDishes.map((dish, index) => (
                    <motion.div
                      key={dish.id}
                      className="bg-white/10 rounded-lg p-3 border border-white/20"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="font-medium text-sm">{dish.originalName}</div>
                      <div className="text-xs text-white/60 mt-1">{dish.originalPrice}</div>
                    </motion.div>
                  ))}
                  {processingStats && processingStats.dishesFound > 3 && (
                    <div className="text-xs text-white/50 text-center pt-2">
                      +{processingStats.dishesFound - 3} more dishes being analyzed...
                    </div>
                  )}
                </div>
              ) : previewText && (
                <div className="text-left">
                  <pre className="text-xs text-white/70 font-mono leading-relaxed whitespace-pre-wrap">
                    {previewText}
                    {previewText.split('\n').length >= 5 && '\n...'}
                  </pre>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip button */}
        <AnimatePresence>
          {processingProgress > 30 && (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 2 }}
            >
              <Button
                onClick={() => router.push("/results")}
                variant="ghost"
                className="text-white/60 text-sm hover:text-white hover:bg-white/10 transition-all duration-300 rounded-full px-6"
              >
                Skip to results →
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}