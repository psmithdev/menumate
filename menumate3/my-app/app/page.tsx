"use client";

import { useState, useEffect } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  Globe,
  Clock,
  Star,
  ChefHat,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhotoUpload } from "@/components/PhotoUpload";
import React, { useRef } from "react";
import {
  preprocessImage,
  analyzeImageQuality,
} from "@/utils/imagePreprocessor";
import { TranslationCache } from "@/utils/translationCache";
import { detectLanguage, getLanguageName } from "@/utils/languages";
import { QRCodeSection } from "@/components/QRCodeSection";
import { parseMenuWithAI } from "@/utils/smartMenuParser";
import { parseMenuWithGPT4 } from "@/utils/smartMenuParserGPT4";
import DebugPanel from "@/components/DebugPanel";
import { ResultsScreen } from "@/components/ResultsScreen";
import { FiltersScreen } from "@/components/FiltersScreen";
import { useDishFilters, defaultFilters } from "@/hooks/useDishFilters";
import { DishImage } from "@/components/DishImage";
import { NutritionInfo } from "@/components/NutritionInfo";
import { DishActionButtons } from "@/components/DishActionButtons";
import { SimilarDishes } from "@/components/SimilarDishes";
import { enhanceDishWithOCR } from "@/utils/enhancedDishParser";
import { getRandomFoodTip } from "@/utils/foodTips";
import { motion, AnimatePresence } from "framer-motion";

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

// Client-side image compression (only works in browser)
function compressImage(
  file: File,
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      reject(new Error("Compression only available in browser"));
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new window.Image(); // Use window.Image for browser compatibility

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }

          // Create a new File object with the compressed data
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () =>
      reject(new Error("Failed to load image for compression"));
    img.src = URL.createObjectURL(file);
  });
}

export default function MenuTranslatorDesign() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");

  const [selectedDish, setSelectedDish] = useState<ParsedDish | null>(null);
  const [menuImage, setMenuImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentProcessingStep, setCurrentProcessingStep] = useState('');
  const [processingStats, setProcessingStats] = useState<{
    imageSize: string;
    ocrTime: number;
    dishesFound: number;
    confidence: number;
  } | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  const [previewDishes, setPreviewDishes] = useState<ParsedDish[]>([]);
  const [currentFoodTip, setCurrentFoodTip] = useState<string>("");
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [parsedDishes, setParsedDishes] = useState<ParsedDish[]>([]);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en");
  const [targetLanguage, setTargetLanguage] = useState<string>("en");
  
  // Temporary filter state for the filters screen
  const [tempFilters, setTempFilters] = useState(defaultFilters);
  
  // Always call hooks at top level
  const {
    filteredDishes: tempFilteredDishes,
    filters: currentFilters,
    filterStats
  } = useDishFilters(parsedDishes);



  // Smart parsing function with Google Cloud Vision (primary) and GPT-4o (fallback)
  const trySmartParsing = async (imageFile: File, useGPT4Fallback = false) => {
    try {
      if (useGPT4Fallback) {
        if (process.env.NODE_ENV === "development") {
          console.log("🔄 Trying GPT-4o fallback...");
        }
        const result = await parseMenuWithGPT4(imageFile);
        if (process.env.NODE_ENV === "development") {
          console.log("✅ GPT-4o parsing result:", result);
        }
        return result;
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log("🚀 Using Google Cloud Vision + intelligent parsing...");
        }
        const result = await parseMenuWithAI(imageFile);
        if (process.env.NODE_ENV === "development") {
          console.log("✅ Google Vision parsing result:", result);
        }
        return result;
      }
    } catch (error) {
      console.error("❌ Smart parsing failed:", error);
      return null;
    }
  };

  // Enhanced error handling for OCR with real progress tracking
  useEffect(() => {
    if (currentScreen === "processing" && menuImage) {
      setIsProcessing(true);
      setProcessingError(null);
      setRetryCount(0);
      setProcessingProgress(0);
      setCurrentProcessingStep('Initializing...');
      setProcessingStats(null);
      setPreviewText('');
      setPreviewDishes([]);

      const performOcr = async () => {
        try {
          // Step 1: Image preprocessing (0-20%)
          setProcessingProgress(5);
          setCurrentProcessingStep('Analyzing image quality...');
          const imageSizeMB = (menuImage.size / (1024 * 1024)).toFixed(2);
          setProcessingStats({ imageSize: `${imageSizeMB}MB`, ocrTime: 0, dishesFound: 0, confidence: 0 });
          
          await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX
          
          setProcessingProgress(15);
          setCurrentProcessingStep('Preparing image for OCR...');
          await new Promise(resolve => setTimeout(resolve, 300));
          // Step 2: OCR Processing (20-70%)
          setProcessingProgress(25);
          setCurrentProcessingStep('Extracting text from menu...');
          const ocrStartTime = Date.now();
          
          // Try Google Cloud Vision + intelligent parsing first (fast & accurate)
          let smartResult = await trySmartParsing(menuImage, false);
          
          const ocrTime = Date.now() - ocrStartTime;
          setProcessingStats(prev => ({ ...prev!, ocrTime }));
          setProcessingProgress(50);
          setCurrentProcessingStep('Analyzing menu structure...');
          
          // Show preview of extracted text if available
          if (smartResult && smartResult.dishes) {
            const previewText = smartResult.dishes.slice(0, 5)
              .map((dish: { name: string; price?: string }) => `${dish.name} ${dish.price || ''}`)
              .join('\n');
            setPreviewText(previewText);
          }

          // If Google Vision fails or returns few dishes, try GPT-4o fallback
          if (
            !smartResult ||
            (smartResult.dishes && smartResult.dishes.length < 8)
          ) {
            setProcessingProgress(60);
            setCurrentProcessingStep('Trying advanced parsing fallback...');
            if (process.env.NODE_ENV === "development") {
              console.log(
                "🔄 Google Vision result insufficient, trying GPT-4o fallback..."
              );
            }
            smartResult = await trySmartParsing(menuImage, true);
          }

          if (smartResult) {
            // Step 3: Dish analysis and enhancement (70-90%)
            setProcessingProgress(75);
            setCurrentProcessingStep('Analyzing dishes and prices...');
            
            const dishCount = smartResult.dishes.length;
            setProcessingStats(prev => ({ ...prev!, dishesFound: dishCount, confidence: smartResult.confidence }));
            
            // Show preview of first few dishes as they're being processed
            const previewDishes = smartResult.dishes.slice(0, 3).map(
              (dish: {
                name: string;
                price?: string;
                category?: string;
                spiceLevel?: number;
                isVegetarian?: boolean;
              }, index: number) => ({
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
            
            await new Promise(resolve => setTimeout(resolve, 800)); // Allow UI to update
            
            // Convert smart result to ParsedDish format
            const dishes = smartResult.dishes.map(
              (dish: {
                name: string;
                price?: string;
                category?: string;
                spiceLevel?: number;
                isVegetarian?: boolean;
              }, index: number) => ({
                id: `smart-dish-${index}`,
                originalName: dish.name,
                originalPrice: dish.price || "Price not detected",
                translatedName: undefined,
                translatedPrice: undefined,
                description: `${
                  dish.category
                    ? `${
                        dish.category.charAt(0).toUpperCase() +
                        dish.category.slice(1)
                      } - `
                    : ""
                }${dish.name}`,
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

            // Step 4: Finalization (90-100%)
            setProcessingProgress(90);
            setCurrentProcessingStep('Finalizing menu analysis...');
            
            // Set OCR text for translation system compatibility
            const combinedText = smartResult.dishes
              .map((dish: { name: string; price?: string }) => `${dish.name} ${dish.price || ""}`)
              .join("\n");

            setParsedDishes(dishes);
            setOcrText(combinedText);
            setDetectedLanguage(smartResult.language);
            
            setProcessingProgress(100);
            setCurrentProcessingStep('Complete! Preparing results...');
            
            // Brief pause to show completion
            await new Promise(resolve => setTimeout(resolve, 500));
            
            setCurrentScreen("results");
            return;
          }

          // Fallback to traditional OCR + regex parsing
          setProcessingProgress(30);
          setCurrentProcessingStep('Using traditional OCR fallback...');
          
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
          
          setProcessingProgress(80);
          setCurrentProcessingStep('Processing extracted text...');
          setProcessingStats(prev => ({ ...prev!, ocrTime: data.processingTime || 0, confidence: data.confidence || 0 }));
          
          // Show preview of extracted text
          const textPreview = data.text.split('\n').slice(0, 5).join('\n');
          setPreviewText(textPreview);

          if (!data.text || data.text.trim().length === 0) {
            throw new Error(
              "No text was detected in the image. Please try a clearer photo."
            );
          }

          setProcessingProgress(100);
          setCurrentProcessingStep('Complete!');
          setOcrText(data.text);
          
          await new Promise(resolve => setTimeout(resolve, 300));
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
          setProcessingProgress(0);
          setCurrentProcessingStep('');
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

  // Update language detection when OCR text changes
  useEffect(() => {
    if (ocrText) {
      // Detect language from OCR text for translation purposes
      const detected = detectLanguage(ocrText);
      setDetectedLanguage(detected);

      // Set target language to English by default
      setTargetLanguage("en");
    }
  }, [ocrText]);

  // Update dishes when translation is complete
  useEffect(() => {
    if (translatedText) {
      const translatedLines = translatedText
        .split("\n")
        .filter((line) => line.trim());

      // Use functional update to avoid dependency on parsedDishes
      setParsedDishes((currentDishes) => {
        if (currentDishes.length === 0) return currentDishes;

        return currentDishes.map((dish, index) => {
          const translatedLine = translatedLines[index];
          if (translatedLine) {
            const priceMatch = translatedLine.match(
              /[¥$€£]\s*(\d+(?:\.\d{2})?)/
            );
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

  // Cleanup camera when leaving camera screen
  useEffect(() => {
    if (currentScreen !== "camera" && cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setShowCamera(false);
    }
  }, [currentScreen, cameraStream]);

  // Handle rotating food tips during processing
  useEffect(() => {
    if (currentScreen === "processing" && isProcessing) {
      // Set initial tip
      setCurrentFoodTip(getRandomFoodTip());
      
      // Rotate tips every 3 seconds
      const tipInterval = setInterval(() => {
        setCurrentFoodTip(getRandomFoodTip());
      }, 3000);
      
      return () => clearInterval(tipInterval);
    }
  }, [currentScreen, isProcessing]);

  // Handle estimated time remaining updates
  useEffect(() => {
    if (currentScreen === "processing" && isProcessing) {
      const timeInterval = setInterval(() => {
        const estimated = Math.max(0, estimatedTimeRemaining - 1);
        setEstimatedTimeRemaining(estimated);
      }, 1000);
      
      return () => clearInterval(timeInterval);
    }
  }, [currentScreen, isProcessing, estimatedTimeRemaining]);

  // Handle confidence checking for retake prompt
  // Note: Confidence prompt is now handled inline in the processing screen


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
        return;
      }

      // Check file size and compress if too large
      let finalFile = file;
      if (file.size > 8 * 1024 * 1024) {
        // 8MB threshold
        setCameraError("Compressing large image...");
        try {
          finalFile = await compressImage(file, 0.8, 1920, 1080);
          if (process.env.NODE_ENV === "development") {
            console.log(
              `Compressed image from ${(file.size / 1024 / 1024).toFixed(
                2
              )}MB to ${(finalFile.size / 1024 / 1024).toFixed(2)}MB`
            );
          }
          setCameraError(null);
        } catch (error) {
          console.error("Compression failed:", error);
          if (file.size > 15 * 1024 * 1024) {
            // Hard limit
            setCameraError("Image too large. Please select a smaller image.");
            return;
          }
          finalFile = file; // Use original if compression fails but still under hard limit
        }
      }

      setCameraError(null);

      // Analyze image quality and preprocess if needed
      try {
        const quality = await analyzeImageQuality(finalFile);
        let processedFile = finalFile;

        if (quality.needsPreprocessing) {
          processedFile = await preprocessImage(finalFile, {
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
        // Fallback to compressed file
        setMenuImage(finalFile);
        setCurrentScreen("processing");
      }
    };

    const triggerFileInput = () => {
      fileInputRef.current?.click();
    };

    // Detect if we're on desktop/laptop vs mobile with better reliability
    const isDesktop = () => {
      if (typeof window === 'undefined') return false;
      
      // More reliable desktop detection
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isWideScreen = window.innerWidth > 1024; // Higher threshold
      const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Desktop if: wide screen AND no mobile user agent AND (no touch OR touch with mouse)
      return isWideScreen && !isMobileUA && (!hasTouch || window.innerWidth > 1200);
    };

    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          setCameraError("Starting camera...");
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: isDesktop() ? 'user' : 'environment', // Front camera on desktop, rear on mobile
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }
          });
          
          setCameraStream(stream);
          setShowCamera(true);
          setCameraError(null);
          
          // Set video source with proper waiting for element to be ready
          setTimeout(() => {
            if (videoRef.current && stream) {
              videoRef.current.srcObject = stream;
              // Ensure video metadata is loaded
              videoRef.current.onloadedmetadata = () => {
                if (videoRef.current) {
                  videoRef.current.play().catch(e => {
                    if (process.env.NODE_ENV === "development") {
                      console.log('Video play failed:', e);
                    }
                  });
                }
              };
            }
          }, 100);
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.log('Camera access denied:', error);
          }
          setCameraError("Camera access denied. Using file picker fallback...");
          setTimeout(() => {
            setCameraError(null);
            // Fallback to file input on desktop, mobile-optimized input on mobile
            if (isDesktop()) {
              triggerFileInput();
            } else {
              triggerMobileFileInput();
            }
          }, 2000);
        }
      } else {
        setCameraError("Camera not supported. Using file picker...");
        setTimeout(() => {
          setCameraError(null);
          if (isDesktop()) {
            triggerFileInput();
          } else {
            triggerMobileFileInput();
          }
        }, 2000);
      }
    };

    const stopCamera = () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setShowCamera(false);
    };

    const capturePhoto = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Check if video has valid dimensions
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          setCameraError("Video not ready. Please wait a moment and try again.");
          setTimeout(() => setCameraError(null), 3000);
          return;
        }
        
        const context = canvas.getContext('2d');
        
        if (!context) {
          setCameraError("Canvas not supported. Please try upload instead.");
          setTimeout(() => setCameraError(null), 3000);
          return;
        }
        
        try {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw video frame to canvas
          context.drawImage(video, 0, 0);
          
          // Convert canvas to blob with error handling
          canvas.toBlob(async (blob) => {
            if (blob) {
              try {
                const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
                stopCamera();
                
                // Process the captured image
                const event = {
                  target: { files: [file] }
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                
                await handleFileChange(event);
              } catch (error) {
                console.error('File creation failed:', error);
                setCameraError("Failed to create image file. Please try again.");
                setTimeout(() => setCameraError(null), 3000);
              }
            } else {
              setCameraError("Failed to capture image. Please try again.");
              setTimeout(() => setCameraError(null), 3000);
            }
          }, 'image/jpeg', 0.9);
        } catch (error) {
          console.error('Canvas capture failed:', error);
          setCameraError("Failed to capture image. Please try upload instead.");
          setTimeout(() => setCameraError(null), 3000);
        }
      } else {
        setCameraError("Camera not ready. Please try again.");
        setTimeout(() => setCameraError(null), 3000);
      }
    };

    const triggerMobileFileInput = () => {
      // Create mobile-optimized file input with camera preference
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.style.display = 'none';
      
      let cleanedUp = false;
      
      const cleanup = () => {
        if (!cleanedUp && document.body.contains(input)) {
          document.body.removeChild(input);
          cleanedUp = true;
        }
      };
      
      input.onchange = (e) => {
        const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileChange(event);
        cleanup();
      };
      
      // Cleanup after a timeout in case user cancels
      setTimeout(cleanup, 60000); // 1 minute timeout
      
      try {
        document.body.appendChild(input);
        input.click();
      } catch (error) {
        console.error('File input failed:', error);
        cleanup();
        // Fallback to regular file input
        triggerFileInput();
      }
    };

    const handleTakePhoto = () => {
      if (isDesktop()) {
        // On desktop: Use getUserMedia for live camera
        startCamera();
      } else {
        // On mobile: Use file input with camera preference
        triggerMobileFileInput();
      }
    };


    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentScreen("welcome")}
              className="text-white hover:bg-white/20 rounded-full"
            >
              ← Back
            </Button>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">Ready to Capture</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center min-h-screen p-6 pt-24 pb-32">
          {/* Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center mb-4">
              <Camera className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-white mb-4">
              Capture Your Menu
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-md">
              Take a photo or upload an image of any menu to get instant translations and dish insights
            </p>
          </div>

          {/* Camera Preview or Action Buttons */}
          {showCamera ? (
            <div className="w-full max-w-md">
              {/* Live Camera Preview */}
              <div className="relative mb-6">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-80 object-cover rounded-2xl bg-black"
                />
                {/* Viewfinder overlay */}
                <div className="absolute inset-4 border-2 border-white/50 rounded-xl pointer-events-none">
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white"></div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              {/* Camera Controls */}
              <div className="flex items-center justify-center gap-6">
                <Button
                  onClick={stopCamera}
                  variant="ghost"
                  size="sm"
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg text-white hover:bg-white/30"
                >
                  ✕
                </Button>
                
                <Button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-xl"
                >
                  <div className="w-12 h-12 rounded-full border-4 border-white"></div>
                </Button>
                
                <Button
                  onClick={triggerFileInput}
                  variant="ghost"
                  size="sm"
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg text-white hover:bg-white/30"
                >
                  <Upload className="w-5 h-5" />
                </Button>
              </div>
              
              <p className="text-white/60 text-sm text-center mt-4">
                Position your menu in the frame and tap the capture button
              </p>
            </div>
          ) : (
            <div className="space-y-4 w-full max-w-sm">
              {/* Primary Action - Take Photo */}
              <Button
                onClick={handleTakePhoto}
                className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-lg font-semibold shadow-xl flex items-center justify-center gap-3"
              >
                <Camera className="w-6 h-6" />
                Take Photo
              </Button>

              {/* Secondary Action - Upload from Gallery */}
              <Button
                onClick={triggerFileInput}
                variant="outline"
                className="w-full h-14 border-2 border-white/30 text-white hover:bg-white/10 rounded-2xl text-lg font-medium flex items-center justify-center gap-3"
              >
                <Upload className="w-5 h-5" />
                Upload from Gallery
              </Button>
            </div>
          )}

          {/* Error Display */}
          {cameraError && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-center max-w-sm">
              {cameraError}
            </div>
          )}

          {/* Tips */}
          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm mb-2">
              💡 <strong>How it works:</strong>
            </p>
            <ul className="text-white/50 text-xs space-y-1 max-w-sm">
              <li>• <strong>Take Photo:</strong> Live camera on desktop, camera app on mobile</li>
              <li>• <strong>Upload from Gallery:</strong> Browse existing photos</li>
              <li>• Best results: Good lighting, steady hands, clear text</li>
              <li>• Include the full menu section you want translated</li>
            </ul>
          </div>
        </div>

        {/* Hidden file input for gallery upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
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
    const getStepStatus = (stepIndex: number) => {
      const currentStep = Math.floor(processingProgress / 25);
      if (stepIndex < currentStep) return 'completed';
      if (stepIndex === currentStep) return 'active';
      return 'pending';
    };

    const processingSteps = [
      { icon: CheckCircle, label: 'Scanning image quality', detail: processingStats?.imageSize },
      { icon: Camera, label: 'Extracting text from menu', detail: processingStats?.ocrTime ? `${(processingStats.ocrTime / 1000).toFixed(1)}s` : null },
      { icon: Sparkles, label: 'Analyzing menu structure', detail: processingStats?.dishesFound ? `${processingStats.dishesFound} items` : null },
      { icon: CheckCircle, label: 'Finalizing results', detail: processingStats?.confidence ? `${Math.round(processingStats.confidence * 100)}% confidence` : null }
    ];

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
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full"
            animate={{
              y: [0, 50, 0],
              x: [0, 30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-40 -right-10 w-24 h-24 bg-yellow-300/20 rounded-full"
            animate={{
              y: [0, -40, 0],
              x: [0, -20, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-32 left-20 w-40 h-40 bg-white/5 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="text-center text-white max-w-md relative z-10">
          {/* Animated Chef Cooking Animation */}
          <div className="mb-8">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <motion.div
                className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto"
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <ChefHat className="w-12 h-12 text-white" />
              </motion.div>
              
              {/* Flying dishes animation */}
              <AnimatePresence>
                {isProcessing && (
                  <>
                    <motion.div
                      className="absolute -top-2 -right-2 text-2xl"
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: -20 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      🍜
                    </motion.div>
                    <motion.div
                      className="absolute -bottom-2 -left-2 text-2xl"
                      initial={{ opacity: 0, scale: 0.5, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.5, x: 20 }}
                      transition={{ duration: 0.5, delay: 1 }}
                    >
                      🍛
                    </motion.div>
                    <motion.div
                      className="absolute top-0 -left-4 text-xl"
                      initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                      transition={{ duration: 0.5, delay: 1.5 }}
                    >
                      🥘
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Cooking animation with sparkles */}
            {isProcessing && (
              <motion.div
                className="flex justify-center gap-1 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  className="text-yellow-300 text-lg"
                  animate={{ opacity: [0.5, 1, 0.5], y: [0, -5, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                >
                  ✨
                </motion.div>
                <motion.div
                  className="text-yellow-300 text-lg"
                  animate={{ opacity: [0.5, 1, 0.5], y: [0, -5, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                >
                  ✨
                </motion.div>
                <motion.div
                  className="text-yellow-300 text-lg"
                  animate={{ opacity: [0.5, 1, 0.5], y: [0, -5, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                >
                  ✨
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Enhanced Header with Time Estimate */}
          <motion.div
            className="space-y-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-2">🍳 Cooking Up Your Menu</h2>
            <div className="text-lg font-medium mb-2">
              {processingProgress}% Complete
            </div>
            <div className="text-sm text-white/80 mb-4">
              {getEstimatedTime() > 0 ? `~${getEstimatedTime()}s remaining` : "Almost ready!"}
            </div>
          </motion.div>

          {/* Rotating Food Tips */}
          <motion.div
            className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 mb-6 min-h-[80px] flex items-center justify-center"
            key={currentFoodTip}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <div className="text-sm text-white/70 mb-2">💡 Did you know?</div>
              <p className="text-white font-medium leading-relaxed">
                {currentFoodTip || getRandomFoodTip()}
              </p>
            </div>
          </motion.div>

          {/* Processing Steps with Enhanced Animation */}
          <motion.div
            className="space-y-3 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {processingSteps.map((step, index) => {
              const status = getStepStatus(index);
              const StepIcon = step.icon;
              
              return (
                <motion.div
                  key={index}
                  className={`flex items-center gap-4 p-3 backdrop-blur-lg rounded-xl transition-all duration-500 ${
                    status === 'completed' ? 'bg-green-500/30 border border-green-400/50' :
                    status === 'active' ? 'bg-blue-500/30 border border-blue-400/50' :
                    'bg-white/10 border border-white/20'
                  }`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <motion.div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      status === 'completed' ? 'bg-green-500' :
                      status === 'active' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}
                    animate={status === 'active' ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {status === 'completed' ? (
                      <motion.span
                        className="text-sm font-bold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        ✓
                      </motion.span>
                    ) : status === 'active' ? (
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </motion.div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{step.label}</div>
                    {step.detail && (
                      <div className="text-xs text-white/70 mt-1">{step.detail}</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Enhanced Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-4 mb-6 overflow-hidden backdrop-blur-sm">
            <motion.div
              className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 h-4 rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${processingProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <motion.div
                className="h-full bg-white/30 rounded-full"
                animate={{ x: [-20, 100, -20] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: "20px" }}
              />
            </motion.div>
          </div>

          {/* Live Stats Grid */}
          {processingStats && (
            <motion.div
              className="grid grid-cols-2 gap-3 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {processingStats.imageSize && (
                <motion.div
                  className="bg-white/20 backdrop-blur-lg rounded-xl p-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="text-xs text-white/60">Image Size</div>
                  <div className="font-bold">{processingStats.imageSize}</div>
                </motion.div>
              )}
              {processingStats.ocrTime > 0 && (
                <motion.div
                  className="bg-white/20 backdrop-blur-lg rounded-xl p-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="text-xs text-white/60">Processing Time</div>
                  <div className="font-bold">{(processingStats.ocrTime / 1000).toFixed(1)}s</div>
                </motion.div>
              )}
              {processingStats.dishesFound > 0 && (
                <motion.div
                  className="bg-white/20 backdrop-blur-lg rounded-xl p-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="text-xs text-white/60">Dishes Found</div>
                  <div className="font-bold">{processingStats.dishesFound}</div>
                </motion.div>
              )}
              {processingStats.confidence > 0 && (
                <motion.div
                  className={`backdrop-blur-lg rounded-xl p-3 ${
                    processingStats.confidence < 0.9 ? 'bg-yellow-500/30 border border-yellow-400/50' : 'bg-white/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="text-xs text-white/60">Confidence</div>
                  <div className="font-bold">{Math.round(processingStats.confidence * 100)}%</div>
                </motion.div>
              )}
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
                    onClick={() => setCurrentScreen("camera")}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-2 rounded-lg"
                  >
                    📷 Retake Photo
                  </Button>
                  <Button
                    onClick={() => {/* Dismiss handled by parent state */}}
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

          {/* Live Preview with Enhanced Animation */}
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

          {/* Skip button with animation */}
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
                  onClick={() => setCurrentScreen("results")}
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

  if (currentScreen === "results") {
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
        onDishClick={(dish) => {
          setSelectedDish(dish);
          setCurrentScreen("dish-detail");
        }}
        onFiltersClick={() => setCurrentScreen("filters")}
        onShareClick={() => setCurrentScreen("share")}
        onTranslateClick={() => setCurrentScreen("translate")}
        onRetakePhoto={() => setCurrentScreen("camera")}
        getLanguageName={getLanguageName}
      />
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
    // Enhance dish data with OCR context
    const enhancedDish = enhanceDishWithOCR(selectedDish, ocrText || undefined, detectedLanguage);
    
    const handleShareDish = () => {
      // Custom share logic for this dish
      if (process.env.NODE_ENV === "development") {
        console.log('Sharing dish:', enhancedDish);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Enhanced Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 z-20 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentScreen("results")}
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
                      🌱
                      Vegetarian
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
              allDishes={tempFilteredDishes}
              onDishClick={(dish) => {
                setSelectedDish(dish);
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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

  if (currentScreen === "filters") {
    return (
      <FiltersScreen
        filters={tempFilters}
        filteredCount={tempFilteredDishes.length}
        isLoading={false}
        onFiltersChange={setTempFilters}
        onApply={() => {
          // In a real implementation, this would update the main filters
          setCurrentScreen("results");
        }}
        onCancel={() => {
          setTempFilters(currentFilters); // Reset to current filters
          setCurrentScreen("results");
        }}
        onReset={() => {
          setTempFilters(defaultFilters);
        }}
      />
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

  return (
    <>
      <DebugPanel />
      {null}
    </>
  );
}
