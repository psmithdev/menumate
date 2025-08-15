"use client";

import React, { useState } from "react";
import { Globe, ChevronDown, ChevronUp, CheckCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OCRResultsSectionProps {
  ocrText: string;
  translatedText?: string | null;
  detectedLanguage: string;
  onTranslateClick: () => void;
  getLanguageName: (code: string) => string;
  compact?: boolean;
}

export function OCRResultsSection({
  ocrText,
  translatedText,
  detectedLanguage,
  onTranslateClick,
  getLanguageName,
  compact = false,
}: OCRResultsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [copiedSection, setCopiedSection] = useState<'original' | 'translated' | null>(null);

  const handleCopy = async (text: string, section: 'original' | 'translated') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  // Truncated preview for compact mode
  const previewText = ocrText.slice(0, 120) + (ocrText.length > 120 ? "..." : "");

  return (
    <div className={`bg-white border-b border-gray-200 ${compact ? 'py-3 px-4' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className={`font-semibold text-gray-900 flex items-center gap-2 ${compact ? 'text-base' : 'text-lg'}`}>
            <Globe className={`text-blue-500 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
            {translatedText ? "Text Extraction" : "Extracted Text"}
          </h2>
          
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              {isExpanded ? 
                <ChevronUp className="w-3 h-3" /> : 
                <ChevronDown className="w-3 h-3" />
              }
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Globe className="w-3 h-3 mr-1" />
            {getLanguageName(detectedLanguage)}
          </Badge>
          
          {translatedText ? (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Translated
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onTranslateClick}
              className={`text-blue-600 border-blue-200 hover:bg-blue-50 ${compact ? 'h-7 px-2 text-xs' : ''}`}
            >
              Translate →
            </Button>
          )}
        </div>
      </div>

      {/* Compact preview mode */}
      {compact && !isExpanded && (
        <div className="text-sm text-gray-600 leading-relaxed">
          {previewText}
          {ocrText.length > 120 && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-blue-600 hover:text-blue-800 ml-1 underline"
            >
              Show more
            </button>
          )}
        </div>
      )}

      {/* Full content (shown when expanded or not in compact mode) */}
      {(isExpanded || !compact) && (
        <div className={translatedText ? "grid grid-cols-1 md:grid-cols-2 gap-4" : ""}>
          {/* Original Text */}
          <div className={translatedText ? "" : "max-w-full"}>
            {translatedText && (
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Original ({getLanguageName(detectedLanguage)})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(ocrText, 'original')}
                  className="h-6 px-2 text-xs hover:bg-gray-100"
                >
                  {copiedSection === 'original' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            )}
            
            <div className={`rounded-lg p-3 border ${compact ? 'max-h-32' : 'max-h-48'} overflow-y-auto ${
              translatedText ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <pre className={`text-gray-700 whitespace-pre-wrap font-mono leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
                {ocrText}
              </pre>
            </div>
          </div>

          {/* Translated Text */}
          {translatedText && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Translated (English)
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(translatedText, 'translated')}
                  className="h-6 px-2 text-xs hover:bg-gray-100"
                >
                  {copiedSection === 'translated' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              
              <div className={`bg-green-50 rounded-lg p-3 border border-green-200 ${compact ? 'max-h-32' : 'max-h-48'} overflow-y-auto`}>
                <pre className={`text-gray-800 whitespace-pre-wrap font-mono leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
                  {translatedText}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      <p className={`text-gray-500 mt-2 ${compact ? 'text-xs' : 'text-xs'}`}>
        {translatedText
          ? "Original text and translation extracted from your menu image."
          : 'This is the raw text extracted from your menu image. Click "Translate" to convert it to English.'}
      </p>
    </div>
  );
}