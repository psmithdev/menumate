"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { TranslationCache } from "@/utils/translationCache";

export default function TranslatePage() {
  const router = useRouter();
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const targetLanguage = "en"; // Fixed to English for now
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const performTranslation = async (text: string) => {
    setIsTranslating(true);
    setTranslationError(null);

    try {
      // Check cache first
      const cachedResult = TranslationCache.get(text, targetLanguage);
      if (cachedResult) {
        setTranslatedText(cachedResult);
        sessionStorage.setItem("translatedText", cachedResult);
        setIsTranslating(false);
        return;
      }

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage }),
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
        text,
        data.translatedText,
        targetLanguage,
        data.confidence || 1.0
      );

      setTranslatedText(data.translatedText);
      sessionStorage.setItem("translatedText", data.translatedText);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to translate text";
      setTranslationError(errorMessage);
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    // Load data from sessionStorage
    const ocrTextData = sessionStorage.getItem("ocrText");
    const translatedTextData = sessionStorage.getItem("translatedText");
    
    if (ocrTextData) {
      setOcrText(ocrTextData);
    }
    if (translatedTextData) {
      setTranslatedText(translatedTextData);
    }

    // If no OCR text, redirect to results
    if (!ocrTextData) {
      router.push("/results");
      return;
    }

    // Start translation if not already translated
    if (ocrTextData && !translatedTextData) {
      performTranslation(ocrTextData);
    }
  }, [router, performTranslation]);

  const handleRetranslate = () => {
    setTranslatedText(null);
    sessionStorage.removeItem("translatedText");
    if (ocrText) {
      performTranslation(ocrText);
    }
  };

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
              onClick={() => router.push("/results")}
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
                onClick={() => router.push("/results")}
                className="bg-green-600 hover:bg-green-700"
              >
                Continue to Results
              </Button>
              <Button
                variant="outline"
                onClick={handleRetranslate}
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
              onClick={() => {
                if (ocrText) {
                  performTranslation(ocrText);
                }
              }}
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