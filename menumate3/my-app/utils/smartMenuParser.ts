// Smart Menu Parser using Google Cloud Vision API + Intelligent Parsing
// Fast, accurate, and cost-effective alternative to GPT-4o

import { validateMenuResult, validateMenuContext } from "./menuValidation";
import { analyzeDish } from "./dishParser";
import { 
  startDebugSession, 
  logOCRResults, 
  logParsingIssue, 
  logDishResult, 
  logRejectedLine, 
  finalizeParsing 
} from "./debugExporter";

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
    
    const finalResult = {
      ...result,
      dishes: validation.filteredDishes,
      totalDishes: validation.filteredDishes.length,
      confidence: calculateOverallConfidence(validation.filteredDishes),
    };
    
    // Finalize debug session
    finalizeParsing(finalResult);
    
    return finalResult;
    
  } catch (error) {
    console.error('Smart menu parsing failed:', error);
    throw new Error('Failed to parse menu with Google Cloud Vision');
  }
}

/**
 * Extract text using Google Cloud Vision API
 */
async function extractTextWithGoogleVision(imageFile: File): Promise<{ text: string; confidence: number }> {
  // Start debug session
  startDebugSession({
    name: imageFile.name,
    size: imageFile.size,
    type: imageFile.type
  });

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

  // Log OCR results for debugging
  logOCRResults(data);

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
  console.log('📝 Full extracted text:');
  console.log(text);
  console.log('📝 Lines to parse:');
  lines.forEach((line, i) => console.log(`${i}: "${line}"`));
  
  // Enhanced Thai menu parsing patterns
  const thaiPatterns = {
    // Enhanced price patterns with better currency detection
    price: /(?:กิโลละ\s*)?(\d+(?:[-\/,]\d+)?)\s*(?:ปอนด์|\s*)(?:บาท|baht|฿|\$)/gi,
    // Just numbers that could be prices (2-4 digits)
    standaloneNumbers: /\b(\d{2,4})\b/g,
    // Price with size indicators
    sizedPrice: /(?:เล็ก|กลาง|ใหญ่|S|M|L)\s*(\d{2,4})\s*(?:บาท|฿)?/gi,
    // Dish name patterns - Thai characters
    thaiText: /[ก-๙]+/,
    // Range price pattern specifically
    rangePrice: /(\d+)[\/\-](\d+)\s*(?:บาท|฿)?/gi,
    // Multiple prices on same line
    multiplePrices: /(\d{2,4})\s*[\/\s]\s*(\d{2,4})(?:\s*[\/\s]\s*(\d{2,4}))?\s*(?:บาท|฿)?/gi
  };
  
  // First pass: Find all lines with prices and potential dish names
  const priceLines: { index: number; price: string; line: string }[] = [];
  const dishNameCandidates: { index: number; name: string; line: string }[] = [];
  
  lines.forEach((line, index) => {
    // Skip headers and very short lines
    if (line.length < 3 || isHeaderLine(line)) {
      return;
    }
    
    // Enhanced price detection with multiple patterns
    let foundPriceOnLine = false;
    
    // Pattern 1: Explicit price with currency - Fixed regex capture
    const explicitPriceMatch = line.match(/(?:กิโลละ\s*)?(\d+(?:[-\/,]\d+)?)\s*(?:ปอนด์|\s*)(?:บาท|baht|฿|\$)/gi);
    if (explicitPriceMatch && explicitPriceMatch.length > 0) {
      // Extract the first price number from the match
      const fullMatch = explicitPriceMatch[0];
      const priceNumber = fullMatch.match(/(\d+(?:[-\/,]\d+)?)/);  
      if (priceNumber) {
        const price = priceNumber[1];
        console.log(`💰 Found explicit price on line ${index}: "${line}" -> ${price} บาท`);
        priceLines.push({ index, price, line });
        foundPriceOnLine = true;
        
        // Check if the same line has a dish name
        const dishName = line.replace(fullMatch, '').trim();
        const cleanName = cleanDishName(dishName);
        if (cleanName && cleanName.length > 2 && hasThaiText(cleanName)) {
          console.log(`🍽️ Found dish with explicit price on same line: "${cleanName}"`);
          dishes.push({
            name: cleanName,
            price: `${price} บาท`,
            confidence: 0.95,
            category: categorizeByName(cleanName)
          });
        }
      }
    }
    
    // Pattern 2: Multiple prices (e.g., "80/100/120") - Fixed regex capture
    if (!foundPriceOnLine) {
      const multiplePriceMatch = line.match(/(\d{2,4})\s*[\/\s]\s*(\d{2,4})(?:\s*[\/\s]\s*(\d{2,4}))?\s*(?:บาท|฿)?/gi);
      if (multiplePriceMatch && multiplePriceMatch.length > 0) {
        // Extract all price numbers from the match
        const allNumbers = line.match(/\d{2,4}/g) || [];
        const validPrices = allNumbers.filter(num => {
          const price = parseInt(num);
          return price >= 20 && price <= 2000; // Reasonable price range
        });
        
        if (validPrices.length > 1) {
          console.log(`💰 Found multiple prices on line ${index}: "${line}" -> [${validPrices.join(', ')}] บาท`);
          
          // Use the first/smallest price for main price tracking
          priceLines.push({ index, price: validPrices[0], line });
          foundPriceOnLine = true;
          
          // Check for dish name on same line - remove price pattern
          let dishName = line.replace(/\d{2,4}[\s\/]*\d{2,4}[\s\/]*\d{0,4}\s*(?:บาท|฿)?/gi, '').trim();
          const cleanName = cleanDishName(dishName);
          if (cleanName && cleanName.length > 2 && hasThaiText(cleanName)) {
            console.log(`🍽️ Found dish with multiple prices: "${cleanName}" -> [${validPrices.join('/')}] บาท`);
            dishes.push({
              name: cleanName,
              price: `${validPrices.join('/')} บาท`,
              confidence: 0.90,
              category: categorizeByName(cleanName)
            });
          }
        }
      }
    }
    
    // Pattern 3: Standalone numbers that could be prices
    if (!foundPriceOnLine && hasThaiText(line)) {
      const standaloneNumberMatches = Array.from(line.matchAll(thaiPatterns.standaloneNumbers));
      const validPriceNumbers = standaloneNumberMatches.filter(match => {
        const num = parseInt(match[1]);
        return num >= 20 && num <= 2000; // Reasonable price range
      });
      
      if (validPriceNumbers.length > 0) {
        const price = validPriceNumbers[0][1];
        console.log(`💰 Found potential price number on line ${index}: "${line}" -> ${price} (assumed บาท)`);
        priceLines.push({ index, price, line });
        
        // Check for dish name on same line
        const dishName = line.replace(new RegExp(`\\b${price}\\b`), '').trim();
        const cleanName = cleanDishName(dishName);
        if (cleanName && cleanName.length > 3 && hasThaiText(cleanName)) {
          console.log(`🍽️ Found dish with number price: "${cleanName}" -> ${price} บาท`);
          dishes.push({
            name: cleanName,
            price: `${price} บาท`,
            confidence: 0.80, // Lower confidence for standalone numbers
            category: categorizeByName(cleanName)
          });
        }
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
  
  // Second pass: Enhanced matching of dish names with nearby prices
  dishNameCandidates.forEach(candidate => {
    // Look for prices within 4 lines after the dish name (increased range)
    const nearbyPricesAfter = priceLines.filter(priceLine => 
      priceLine.index > candidate.index && 
      priceLine.index <= candidate.index + 4
    );
    
    // Also look for prices within 2 lines before the dish name
    const nearbyPricesBefore = priceLines.filter(priceLine => 
      priceLine.index < candidate.index && 
      priceLine.index >= candidate.index - 2
    );
    
    const allNearbyPrices = [...nearbyPricesBefore, ...nearbyPricesAfter]
      .sort((a, b) => Math.abs(a.index - candidate.index) - Math.abs(b.index - candidate.index));
    
    if (allNearbyPrices.length > 0) {
      // Use the closest price
      const closestPrice = allNearbyPrices[0];
      const distance = Math.abs(closestPrice.index - candidate.index);
      const direction = closestPrice.index > candidate.index ? 'after' : 'before';
      
      console.log(`🔗 Matching "${candidate.name}" with price ${closestPrice.price} บาท (${distance} lines ${direction})`);
      
      dishes.push({
        name: candidate.name,
        price: `${closestPrice.price} บาท`,
        confidence: Math.max(0.75, 0.95 - (distance * 0.05)), // Reduce confidence based on distance
        category: categorizeByName(candidate.name)
      });
    } else {
      // Check if there are any unmatched standalone numbers on nearby lines
      const nearbyLines = lines.slice(
        Math.max(0, candidate.index - 2), 
        Math.min(lines.length, candidate.index + 5)
      );
      
      let foundImplicitPrice = false;
      for (let i = 0; i < nearbyLines.length; i++) {
        const line = nearbyLines[i];
        const numbers = Array.from(line.matchAll(thaiPatterns.standaloneNumbers))
          .map(match => parseInt(match[1]))
          .filter(num => num >= 20 && num <= 2000);
        
        if (numbers.length > 0 && !hasThaiText(line)) {
          // Found a line with just numbers - likely prices
          const price = numbers[0];
          console.log(`🔗 Matching "${candidate.name}" with implicit price ${price} บาท (from number-only line)`);
          
          dishes.push({
            name: candidate.name,
            price: `${price} บาท`,
            confidence: 0.75,
            category: categorizeByName(candidate.name)
          });
          foundImplicitPrice = true;
          break;
        }
      }
      
      if (!foundImplicitPrice) {
        // No nearby price found, add without price
        console.log(`❓ No price found for "${candidate.name}"`);
        dishes.push({
          name: candidate.name,
          price: "Price not detected",
          confidence: 0.60, // Lower confidence when no price
          category: categorizeByName(candidate.name)
        });
      }
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
    'เมนูราดข้าว', 'เมนูกับข้าว', 'เครื่องเคียงขาหมู', 
    'menu', 'price', 'ราคา', 'ตั้งซุป', 'ร้าน', 'restaurant',
    'อาหาร', 'เครื่องดื่ม', 'ของหวาน'
  ];
  
  const lowerLine = line.toLowerCase().trim();
  
  // Enhanced header detection
  const isExactHeader = headers.some(header => lowerLine === header.toLowerCase());
  const containsHeaderWord = headers.some(header => lowerLine.includes(header.toLowerCase()));
  const hasDecorations = /[•●▪▫★☆✭✳*·]/.test(line);
  const isBrandLine = line.includes('BY ') || /^[A-Z\s&]{3,15}$/.test(line.trim());
  const isMenuCategory = line.startsWith('เมนู') && line.length < 25;
  const isJustNumbers = /^[\d\s\/\-฿บาท]+$/.test(line.trim()) && !hasThaiText(line);
  
  // Debug logging for header detection
  if (isExactHeader || containsHeaderWord || hasDecorations || isBrandLine || isMenuCategory) {
    console.log(`🚨 Detected header line: "${line}" (exact: ${isExactHeader}, contains: ${containsHeaderWord}, decorations: ${hasDecorations}, brand: ${isBrandLine}, category: ${isMenuCategory})`);
  }
  
  return isExactHeader || hasDecorations || isBrandLine || isMenuCategory || isJustNumbers ||
         (containsHeaderWord && line.length < 30); // Only exclude short lines with header words
}

function cleanDishName(name: string): string {
  return name
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s\-\(\)]/g, '') // Keep Thai, English, numbers, spaces, hyphens, parentheses
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/([ก-๙])\s+([ก-๙])/g, '$1$2') // Remove spaces between Thai characters
    .trim();
}

function isLikelyDishName(name: string): boolean {
  // Enhanced dish name validation
  const tooGeneric = ['เมนู', 'ราคา', 'บาท', 'ร้าน', 'อาหาร', 'menu', 'price', 'restaurant']; 
  const tooShort = name.length < 3;
  const tooLong = name.length > 80;
  
  // Exclude pure English promotional text or brand names
  const isEnglishPromo = /^[A-Z\s&]+$/.test(name) && name.includes(' ');
  
  // Exclude lines with only numbers and currency
  const isOnlyPriceInfo = /^[\d\s\/\-฿บาท]+$/.test(name);
  
  // Must contain Thai characters or be a reasonable dish name
  const hasThaiChars = /[ก-๙]/.test(name);
  
  // Exclude time patterns (like "10:00-22:00")
  const isTimePattern = /\d{1,2}:\d{2}/.test(name);
  
  // Exclude promotional phrases
  const isPromotional = /(โปรโมชั่น|ลดราคา|ฟรี|free|promotion|discount)/i.test(name);
  
  // Enhanced dish indicators
  const hasDishIndicators = /(ข้าว|ก๋วยเตี๋ยว|ผัด|ทอด|ยำ|ต้ม|แกง|น้ำ|อาหาร)/.test(name);
  
  const isValid = !tooShort && !tooLong && 
         !tooGeneric.some(generic => name.toLowerCase() === generic.toLowerCase()) &&
         !isEnglishPromo && !isOnlyPriceInfo && !isTimePattern && !isPromotional &&
         (hasThaiChars || hasDishIndicators);
  
  // Debug logging for dish name validation
  if (!isValid && hasThaiChars) {
    console.log(`🚨 Rejected potential dish name: "${name}" (short: ${tooShort}, long: ${tooLong}, generic: ${tooGeneric.some(g => name.toLowerCase() === g.toLowerCase())}, promo: ${isEnglishPromo}, priceOnly: ${isOnlyPriceInfo}, time: ${isTimePattern}, promotional: ${isPromotional})`);
  }
  
  return isValid;
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