"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { PhotoUpload } from "@/components/PhotoUpload";
import React, { useRef } from "react";

type Screen =
  | "welcome"
  | "photo"
  | "camera"
  | "processing"
  | "results"
  | "dish-detail"
  | "filters";

type Dish = {
  id: number;
  name: string;
  originalName: string;
  price: string;
  image: string;
  rating: number;
  time: string;
  spiceLevel: number;
  tags: string[];
  isVegetarian: boolean;
  description: string;
  ingredients: string[];
  calories: number;
  protein: string;
};

export default function MenuTranslatorDesign() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [menuImage, setMenuImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mockDishes = [
    {
      id: 1,
      name: "Kung Pao Chicken",
      originalName: "宫保鸡丁",
      price: "$18.90",
      image: "/placeholder.svg?height=200&width=300",
      rating: 4.8,
      time: "15 min",
      spiceLevel: 3,
      tags: ["Spicy", "Chicken", "Peanuts"],
      isVegetarian: false,
      description:
        "Tender chicken cubes with roasted peanuts in a savory and slightly sweet sauce with dried chilies.",
      ingredients: [
        "Chicken",
        "Peanuts",
        "Sichuan Peppercorns",
        "Dried Chilies",
      ],
      calories: 420,
      protein: "28g",
    },
    {
      id: 2,
      name: "Mapo Tofu",
      originalName: "麻婆豆腐",
      price: "$14.50",
      image: "/placeholder.svg?height=200&width=300",
      rating: 4.6,
      time: "12 min",
      spiceLevel: 4,
      tags: ["Spicy", "Tofu", "Sichuan"],
      isVegetarian: true,
      description:
        "Silky tofu in a fiery Sichuan sauce with ground pork and fermented black beans.",
      ingredients: [
        "Tofu",
        "Ground Pork",
        "Sichuan Peppercorns",
        "Doubanjiang",
      ],
      calories: 280,
      protein: "18g",
    },
    {
      id: 3,
      name: "Sweet & Sour Pork",
      originalName: "糖醋里脊",
      price: "$19.80",
      image: "/placeholder.svg?height=200&width=300",
      rating: 4.4,
      time: "18 min",
      spiceLevel: 0,
      tags: ["Sweet", "Crispy", "Pork"],
      isVegetarian: false,
      description:
        "Crispy pork pieces coated in a glossy sweet and tangy sauce with bell peppers.",
      ingredients: [
        "Pork Tenderloin",
        "Bell Peppers",
        "Pineapple",
        "Sweet & Sour Sauce",
      ],
      calories: 520,
      protein: "32g",
    },
  ];

  useEffect(() => {
    if (currentScreen === "processing" && menuImage) {
      setIsProcessing(true);
      setProcessingError(null);

      const formData = new FormData();
      formData.append("image", menuImage);

      fetch("/api/ocr", {
        method: "POST",
        body: formData,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("OCR failed");
          const data = await res.json();
          setOcrText(data.text);
          setCurrentScreen("results");
        })
        .catch((err) => {
          setProcessingError("Failed to process image. Please try again.");
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }
  }, [currentScreen, menuImage]);

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
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setCameraError("Please select a valid image file.");
        return;
      }
      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setCameraError("Image must be less than 5MB.");
        return;
      }
      setCameraError(null);
      setMenuImage(file);
      setCurrentScreen("processing");
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
                <p className="text-gray-600 text-sm">
                  8 dishes found • Golden Dragon Restaurant
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentScreen("filters")}
                className="rounded-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Badge
                variant="secondary"
                className="whitespace-nowrap bg-orange-100 text-orange-700 border-orange-200"
              >
                <Leaf className="w-3 h-3 mr-1" />
                Vegetarian
              </Badge>
              <Badge variant="outline" className="whitespace-nowrap">
                <Flame className="w-3 h-3 mr-1" />
                Spicy
              </Badge>
              <Badge variant="outline" className="whitespace-nowrap">
                Under $15
              </Badge>
              <Badge variant="outline" className="whitespace-nowrap">
                Quick ({"<"}20min)
              </Badge>
            </div>
          </div>
        </div>

        {/* Dishes Grid */}
        <div className="p-4 space-y-4">
          {mockDishes.map((dish) => (
            <Card
              key={dish.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => {
                setSelectedDish(dish);
                setCurrentScreen("dish-detail");
              }}
            >
              <div className="flex">
                {/* Image */}
                <div className="relative w-24 h-24 flex-shrink-0">
                  <Image
                    src={dish.image || "/placeholder.svg"}
                    alt={dish.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Heart className="w-4 h-4 text-white/80 hover:text-red-400 cursor-pointer" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 leading-tight">
                        {dish.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {dish.originalName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">{dish.price}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">
                          {dish.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tags and Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {dish.time}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {"🌶️".repeat(dish.spiceLevel)}
                      {dish.spiceLevel === 0 && (
                        <span className="text-gray-400">Mild</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {dish.tags.slice(0, 2).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs px-2 py-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {dish.isVegetarian && (
                      <Badge
                        variant="outline"
                        className="text-xs px-2 py-0 text-green-600 border-green-200"
                      >
                        Vegetarian
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6">
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

  if (currentScreen === "dish-detail" && selectedDish) {
    return (
      <div className="min-h-screen bg-white">
        {/* Hero Image */}
        <div className="relative h-80">
          <Image
            src={selectedDish.image || "/placeholder.svg"}
            alt={selectedDish.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentScreen("results")}
            className="absolute top-6 left-4 text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
          >
            ←
          </Button>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-6 right-4 text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
          >
            <Heart className="w-5 h-5" />
          </Button>

          {/* Price Badge */}
          <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2">
            <span className="font-bold text-orange-600 text-lg">
              {selectedDish.price}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedDish.name}
            </h1>
            <p className="text-gray-500 mb-4">{selectedDish.originalName}</p>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{selectedDish.rating}</span>
                <span className="text-gray-500 text-sm">(124 reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{selectedDish.time}</span>
              </div>
              <div className="flex items-center gap-1">
                {"🌶️".repeat(selectedDish.spiceLevel)}
                {selectedDish.spiceLevel === 0 && (
                  <span className="text-gray-400 text-sm">Mild</span>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
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

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-600 leading-relaxed">
              {selectedDish.description}
            </p>
          </div>

          {/* Nutrition */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Nutrition</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {selectedDish.calories}
                </p>
                <p className="text-sm text-gray-600">Calories</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {selectedDish.protein}
                </p>
                <p className="text-sm text-gray-600">Protein</p>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">
              Main Ingredients
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedDish.ingredients.map((ingredient: string) => (
                <Badge key={ingredient} variant="outline" className="px-3 py-1">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <Button className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-lg font-semibold">
            Add to Favorites
          </Button>
        </div>
      </div>
    );
  }

  if (currentScreen === "filters") {
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
              Apply
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
                { label: "Vegetarian", icon: "🥬" },
                { label: "Vegan", icon: "🌱" },
                { label: "Gluten-Free", icon: "🌾" },
                { label: "Dairy-Free", icon: "🥛" },
                { label: "Nut-Free", icon: "🥜" },
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
                  <Switch />
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
                defaultValue="3"
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
                <span className="font-semibold text-gray-900">$5</span>
                <span className="font-semibold text-gray-900">$50+</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                defaultValue="25"
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
                { label: "Recommended for you", icon: "⭐" },
                { label: "Highest rated", icon: "👍" },
                { label: "Price: Low to high", icon: "💰" },
                { label: "Preparation time", icon: "⏱️" },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-colors ${
                    index === 0
                      ? "bg-orange-50 border-2 border-orange-200"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span
                    className={`font-medium ${
                      index === 0 ? "text-orange-700" : "text-gray-900"
                    }`}
                  >
                    {item.label}
                  </span>
                  {index === 0 && (
                    <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            className="w-full h-12 rounded-2xl border-gray-300 text-gray-600 bg-transparent"
          >
            Reset All Filters
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
