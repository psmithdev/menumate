"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Download, Copy, CheckCircle, Heart } from "lucide-react";
import type { ParsedDish } from "@/types/menu";

interface QRCodeSectionProps {
  dishes: ParsedDish[];
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
  restaurantName?: string;
}

export function QRCodeSection({
  dishes,
  originalText,
  translatedText,
  detectedLanguage,
  restaurantName = "Restaurant",
}: QRCodeSectionProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate compact menu data for QR code
  const generateMenuData = () => {
    console.log("Generating compact menu data with dishes:", dishes.length);

    // Create a compact version with only essential data
    const compactDishes = dishes.map((dish) => ({
      n: dish.translatedName || dish.originalName, // name
      o: dish.originalName, // original name
      p: dish.translatedPrice || dish.originalPrice, // price
      v: dish.isVegetarian, // vegetarian
      s: dish.spiceLevel, // spice level
      t: dish.tags.slice(0, 2), // tags (limited to 2)
    }));

    const menuData = {
      r: restaurantName, // restaurant
      l: detectedLanguage, // language
      d: compactDishes, // dishes
      ts: new Date().toISOString().split("T")[0], // timestamp (date only)
    };

    console.log("Compact menu data generated:", menuData);
    return JSON.stringify(menuData);
  };

  // Generate QR code
  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const menuData = generateMenuData();

      // For now, let's use a simple approach - just create a summary QR code
      const summaryData = {
        restaurant: restaurantName,
        dishes: dishes.length,
        language: detectedLanguage,
        timestamp: new Date().toISOString().split("T")[0],
        message: `MenuMate: ${dishes.length} dishes from ${restaurantName}`,
      };

      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(summaryData), {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeDataUrl(qrCodeUrl);
      console.log("Generated summary QR code with", dishes.length, "dishes");
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download QR code
  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement("a");
    link.download = `menu-${restaurantName}-${
      new Date().toISOString().split("T")[0]
    }.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  // Copy menu data to clipboard
  const copyMenuData = async () => {
    try {
      const menuData = generateMenuData();
      await navigator.clipboard.writeText(menuData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  // Generate QR code on component mount
  useEffect(() => {
    if (dishes.length > 0 && dishes.some((dish) => dish.originalName)) {
      console.log("Generating QR code for", dishes.length, "dishes");
      generateQRCode();
    } else {
      console.log("No dishes available for QR code generation");
    }
  }, [dishes, translatedText]);

  return (
    <Card className="p-6 bg-white">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Share This Menu
        </h2>
        <p className="text-gray-600">
          Scan this QR code to get menu information
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Contains menu summary: restaurant, dish count, and language
        </p>
      </div>

      {/* QR Code Display */}
      <div className="flex justify-center mb-6">
        {isGenerating ? (
          <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-gray-500">Generating QR Code...</p>
            </div>
          </div>
        ) : qrCodeDataUrl ? (
          <div className="text-center">
            <img
              src={qrCodeDataUrl}
              alt="Menu QR Code"
              className="w-64 h-64 mx-auto border-4 border-gray-200 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-2">
              {dishes.length} dishes • {detectedLanguage.toUpperCase()} → EN
            </p>
          </div>
        ) : dishes.length > 0 ? (
          <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-2">QR Code Generation Failed</p>
              <p className="text-xs text-gray-400">
                {dishes.length} dishes available
              </p>
              <Button onClick={generateQRCode} size="sm" className="mt-2">
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">No menu data available</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={downloadQRCode}
          disabled={!qrCodeDataUrl}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download QR Code
        </Button>

        <Button
          onClick={copyMenuData}
          disabled={!qrCodeDataUrl}
          variant="outline"
          className="flex items-center gap-2"
        >
          {copied ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Menu Data
            </>
          )}
        </Button>
      </div>

      {/* Menu Preview */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Menu Preview
        </h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {dishes.slice(0, 5).map((dish) => (
            <div
              key={dish.id}
              className="flex justify-between items-center py-2 border-b border-gray-100"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {dish.translatedName || dish.originalName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {dish.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {dish.isVegetarian && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      Vegetarian
                    </Badge>
                  )}
                </div>
              </div>
              <p className="font-semibold text-orange-600 ml-4">
                {dish.translatedPrice || dish.originalPrice}
              </p>
            </div>
          ))}
          {dishes.length > 5 && (
            <p className="text-sm text-gray-500 text-center py-2">
              +{dishes.length - 5} more dishes
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
