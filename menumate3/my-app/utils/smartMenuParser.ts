// Smart Menu Parser using Google Cloud Vision API + Intelligent Parsing
// Fast, accurate, and cost-effective alternative to GPT-4o

import { validateMenuResult, validateMenuContext } from "./menuValidation";
import { analyzeDish } from "./dishParser";

export interface SmartDish {
  name: string;
  price: string;
  description?: string;
  category?: string;
  spiceLevel?: number;
  isVegetarian?: boolean;
  confidence: number; // 0-1 how confident the parsing is
}

export interface SmartMenuResult {
  dishes: SmartDish[];
  totalDishes: number;
  processingTime: number;
  confidence: number;
  language: string;
}

/**
 * Parse menu using Google Cloud Vision API + intelligent text analysis
 * Much faster and more cost-effective than GPT-4o Vision
 */
export async function parseMenuWithAI(imageFile: File): Promise<SmartMenuResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Using Google Cloud Vision API + intelligent parsing...');
    
    // Step 1: Extract text using Google Cloud Vision API
    const ocrResult = await extractTextWithGoogleVision(imageFile);
    console.log('📝 OCR extracted text length:', ocrResult.text.length);
    
    // Step 2: Parse dishes from extracted text
    const parsedDishes = parseTextToDishes(ocrResult.text);
    console.log('🍽️ Initial parsed dishes:', parsedDishes.length);
    
    // Step 3: Enhance with intelligent analysis
    const enhancedDishes = await enhanceDishesWithAnalysis(parsedDishes);
    console.log('⚡ Enhanced dishes:', enhancedDishes.length);
    
    // Step 4: Apply validation and filtering
    const result = {
      dishes: enhancedDishes,
      totalDishes: enhancedDishes.length,
      language: detectLanguage(ocrResult.text),
      processingTime: Date.now() - startTime,
      confidence: calculateOverallConfidence(enhancedDishes)
    };
    
    const validation = validateMenuResult(result);
    
    if (!validation.isValid) {
      throw new Error("No valid dishes found after filtering");
    }
    
    console.log(
      `✅ Google Vision Validation: ${validation.filteredDishes.length} valid dishes, ${validation.rejectedCount} rejected`
    );
    
    if (validation.rejectedCount > 0) {
      console.log("📊 Rejection reasons:", validation.rejectionReasons);
    }
    
    // Validate menu context if dishes contain Thai pork leg indicators
    const hasThaiPorkLeg = validation.filteredDishes.some(
      (d) => d.name?.includes("ขาหมู") || d.name?.includes("pork leg")
    );
    
    if (
      hasThaiPorkLeg &&
      !validateMenuContext(validation.filteredDishes, "pork-leg")
    ) {
      console.warn(
        "⚠️ Menu context validation failed - possible wrong extraction"
      );
      throw new Error(
        "Menu context validation failed - extracted wrong menu type"
      );
    }
    
    return {
      ...result,
      dishes: validation.filteredDishes,
      totalDishes: validation.filteredDishes.length,
      confidence: calculateOverallConfidence(validation.filteredDishes),
    };
    
  } catch (error) {
    console.error('Smart menu parsing failed:', error);
    throw new Error('Failed to parse menu with Google Cloud Vision');
  }
}

/**
 * Extract text using Google Cloud Vision API
 */
async function extractTextWithGoogleVision(imageFile: File): Promise<{ text: string; confidence: number }> {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch("/api/ocr", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `OCR failed with status ${response.status}`
    );
  }

  const data = await response.json();

  if (!data.text || data.text.trim().length === 0) {
    throw new Error("No text detected in image");
  }

  return {
    text: data.text,
    confidence: data.confidence || 1.0
  };
}

/**
 * Parse extracted text into dishes using intelligent text analysis
 * Handles cases where dish names and prices are on separate lines
 */
function parseTextToDishes(text: string): SmartDish[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const dishes: SmartDish[] = [];
  
  console.log('🔍 Parsing menu text with', lines.length, 'lines');
  
  // Thai menu parsing patterns
  const thaiPatterns = {
    // Price patterns: "120 บาท", "120/220 บาท", "120-220 บาท", "กิโลละ 420 บาท"
    price: /(?:กิโลละ\s*)?(\d+(?:[-\/]\d+)?)\s*(?:บาท|baht|฿)/gi,
    // Dish name patterns - Thai characters
    thaiText: /[ก-๙]+/,
    // Range price pattern specifically
    rangePrice: /(\d+)\/(\d+)\s*บาท/gi,
  };
  
  // First pass: Find all lines with prices and potential dish names
  const priceLines: { index: number; price: string; line: string }[] = [];
  const dishNameCandidates: { index: number; name: string; line: string }[] = [];
  
  lines.forEach((line, index) => {
    // Skip headers and very short lines
    if (line.length < 3 || isHeaderLine(line)) {
      return;
    }
    
    // Check if line contains a price
    const priceMatch = line.match(thaiPatterns.price);
    if (priceMatch) {
      const price = priceMatch[1];
      console.log(`💰 Found price on line ${index}: "${line}" -> ${price} บาท`);
      priceLines.push({ index, price, line });
      
      // Also check if the same line has a dish name
      const dishName = line.replace(priceMatch[0], '').trim();
      const cleanName = cleanDishName(dishName);
      if (cleanName && cleanName.length > 2 && hasThaiText(cleanName)) {
        console.log(`🍽️ Found dish with price on same line: "${cleanName}"`);
        dishes.push({
          name: cleanName,
          price: `${price} บาท`,
          confidence: 0.95,
          category: categorizeByName(cleanName)
        });
      }
    }
    // Check if line looks like a dish name
    else if (hasThaiText(line) && line.length > 3 && line.length < 100) {
      const cleanName = cleanDishName(line);
      if (cleanName && isLikelyDishName(cleanName)) {
        console.log(`🍽️ Found potential dish name on line ${index}: "${cleanName}"`);
        dishNameCandidates.push({ index, name: cleanName, line });
      }
    }
  });
  
  // Second pass: Match dish names with nearby prices
  dishNameCandidates.forEach(candidate => {
    // Look for prices within 3 lines after the dish name
    const nearbyPrices = priceLines.filter(priceLine => 
      priceLine.index > candidate.index && 
      priceLine.index <= candidate.index + 3
    );
    
    if (nearbyPrices.length > 0) {
      // Use the closest price
      const closestPrice = nearbyPrices[0];
      console.log(`🔗 Matching "${candidate.name}" with price ${closestPrice.price} บาท`);
      
      dishes.push({
        name: candidate.name,
        price: `${closestPrice.price} บาท`,
        confidence: 0.85,
        category: categorizeByName(candidate.name)
      });
    } else {
      // No nearby price found, add without price
      console.log(`❓ No price found for "${candidate.name}"`);
      dishes.push({
        name: candidate.name,
        price: "Price not shown",
        confidence: 0.7,
        category: categorizeByName(candidate.name)
      });
    }
  });
  
  console.log(`📊 Parsed ${dishes.length} dishes total`);
  
  // Remove duplicates based on similar names
  return removeDuplicateDishes(dishes);
}

/**
 * Enhance dishes with intelligent analysis from dishParser
 */
async function enhanceDishesWithAnalysis(dishes: SmartDish[]): Promise<SmartDish[]> {
  return dishes.map(dish => {
    try {
      // Use existing dishParser to analyze the dish
      const analysis = analyzeDish(dish.name, 'thai');
      
      return {
        ...dish,
        spiceLevel: analysis.spiceLevel,
        isVegetarian: analysis.isVegetarian,
        description: analysis.tags.join(', '),
        // Boost confidence if we have good analysis
        confidence: Math.min(dish.confidence + 0.1, 1.0)
      };
    } catch (error) {
      console.warn('Failed to analyze dish:', dish.name, error);
      return dish;
    }
  });
}

// Helper functions

function hasThaiText(text: string): boolean {
  return /[ก-๙]/.test(text);
}

function isHeaderLine(line: string): boolean {
  const headers = [
    'เมนูราดข้าว', 'เมนูกับข้าว', 'เครื่องเคียงขาหมู', 'menu', 'price', 'ราคา', 'ตั้งซุป'
  ];
  
  const lowerLine = line.toLowerCase();
  
  // Only exclude if it's exactly a header or contains bullet points/decorations
  return headers.some(header => lowerLine.includes(header)) || 
         line.includes('•') || 
         line.includes('BY') ||
         line.startsWith('เมนู') ||
         (line.length < 8 && /^[A-Z\s]+$/.test(line)); // Short all-caps English
}

function cleanDishName(name: string): string {
  return name
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s\-\(\)]/g, '') // Keep Thai, English, numbers, spaces, hyphens, parentheses
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

function isLikelyDishName(name: string): boolean {
  // Check if it looks like a dish name (not too generic, not too long)
  const tooGeneric = ['เมนู', 'ราคา', 'บาท']; // Only exclude obvious non-dish words
  const tooShort = name.length < 3; // Allow shorter names
  const tooLong = name.length > 80;
  
  // Exclude pure English promotional text
  const isEnglishPromo = /^[A-Z\s]+$/.test(name) && name.includes(' ');
  
  // Must contain Thai characters or be a reasonable dish name
  const hasThaiChars = /[ก-๙]/.test(name);
  
  return !tooShort && !tooLong && 
         !tooGeneric.some(generic => name === generic) &&
         !isEnglishPromo &&
         hasThaiChars;
}

function categorizeByName(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('ข้าว')) return 'rice';
  if (lowerName.includes('ต้ม') || lowerName.includes('แกง')) return 'soup';
  if (lowerName.includes('น้ำ') || lowerName.includes('ชา') || lowerName.includes('กาแฟ')) return 'drink';
  if (lowerName.includes('ของหวาน') || lowerName.includes('ไอศ')) return 'dessert';
  if (lowerName.includes('ผัก') || lowerName.includes('สลัด')) return 'vegetable';
  
  return 'main';
}

function removeDuplicateDishes(dishes: SmartDish[]): SmartDish[] {
  const unique: SmartDish[] = [];
  const seen = new Set<string>();
  
  for (const dish of dishes) {
    // Create a normalized key for comparison
    const key = dish.name.toLowerCase().replace(/\s+/g, '');
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(dish);
    }
  }
  
  return unique;
}

function detectLanguage(text: string): string {
  if (hasThaiText(text)) return 'th';
  if (/[一-龯]/.test(text)) return 'zh';
  if (/[ひらがなカタカナ]/.test(text)) return 'ja';
  if (/[가-힣]/.test(text)) return 'ko';
  return 'en';
}

function calculateOverallConfidence(dishes: SmartDish[]): number {
  if (dishes.length === 0) return 0;
  const avgConfidence =
    dishes.reduce((sum, dish) => sum + dish.confidence, 0) / dishes.length;
  return Math.round(avgConfidence * 100) / 100;
}

/**
 * Fallback: Use multiple APIs for maximum accuracy
 */
export async function parseMenuMultiAPI(imageFile: File): Promise<SmartMenuResult> {
  const apis = [
    () => parseMenuWithAI(imageFile), // Google Cloud Vision + Intelligent parsing
    () => parseWithMindee(imageFile),  // Mindee Menu API (if implemented)
    () => parseWithGoogleAI(imageFile) // Google Document AI (if implemented)
  ];

  // Try each API, use the one with highest confidence
  for (const apiCall of apis) {
    try {
      const result = await apiCall();
      if (result.confidence > 0.8) {
        return result; // High confidence, use this result
      }
    } catch (error) {
      console.warn('API failed, trying next:', error);
      continue;
    }
  }

  throw new Error('All menu parsing APIs failed');
}

async function parseWithMindee(imageFile: File): Promise<SmartMenuResult> {
  // Mindee Menu API implementation
  // https://developers.mindee.com/docs/menu-api
  throw new Error('Not implemented - replace with actual Mindee API');
}

async function parseWithGoogleAI(imageFile: File): Promise<SmartMenuResult> {
  // Google Document AI implementation
  // https://cloud.google.com/document-ai/docs/processors-list#processor_menu
  throw new Error('Not implemented - replace with actual Google API');
}