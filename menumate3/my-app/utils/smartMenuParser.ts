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
  finalizeParsing,
  logPatternMatchingDetails,
  logPriceExtractionFailure,
  setExpectedDishes
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
export function parseTextToDishes(text: string): SmartDish[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const dishes: SmartDish[] = [];
  
  console.log('🔍 Parsing menu text with', lines.length, 'lines');
  console.log('📝 Full extracted text:');
  console.log(text);
  console.log('📝 Lines to parse:');
  lines.forEach((line, i) => console.log(`${i}: "${line}"`));
  
  // Enhanced Thai menu parsing patterns
  const thaiPatterns = {
    // Enhanced price patterns with better currency detection including พิเศษ format
    price: /(?:กิโลละ\s*)?(\d+(?:[-\/,]\d+)?)\s*(?:ปอนด์|\s*)(?:บาท|baht|฿|\$|พิเศษ)/gi,
    // Just numbers that could be prices (2-4 digits) 
    standaloneNumbers: /\b(\d{2,4})\b/g,
    // Price with size indicators including พิเศษ
    sizedPrice: /(?:เล็ก|กลาง|ใหญ่|พิเศษ|S|M|L)\s*(\d{2,4})\s*(?:บาท|฿|พิเศษ)?/gi,
    // Thai price format: number + พิเศษ + number (e.g., "40 พิเศษ 50")
    thaiSpecialPrice: /(\d{2,4})\s*พิเศษ\s*(\d{2,4})/gi,
    // Dish name patterns - Thai characters
    thaiText: /[ก-๙]+/,
    // Range price pattern specifically including พิเศษ
    rangePrice: /(\d+)[\/\-](\d+)\s*(?:บาท|฿|พิเศษ)?/gi,
    // Multiple prices on same line including พิเศษ format
    multiplePrices: /(\d{2,4})\s*(?:[\/\s]|พิเศษ)\s*(\d{2,4})(?:\s*[\/\s]\s*(\d{2,4}))?\s*(?:บาท|฿|พิเศษ)?/gi
  };
  
  // Set expected dishes based on manual count from image - approximately 16 dishes
  setExpectedDishes(16);

  // First pass: Find all lines with prices and potential dish names
  const priceLines: { index: number; price: string; line: string }[] = [];
  const dishNameCandidates: { index: number; name: string; line: string }[] = [];
  
  lines.forEach((line, index) => {
    const patternsAttempted: string[] = [];
    const patternResults: Array<{
      pattern: string;
      matched: boolean;
      extractedData?: any;
      failureReason?: string;
    }> = [];

    // Skip headers and very short lines
    if (line.length < 3 || isHeaderLine(line)) {
      logPatternMatchingDetails(
        line,
        false,
        ['header-check'],
        [{ pattern: 'header-check', matched: true, extractedData: 'header detected' }],
        'header',
        'Line identified as header or too short'
      );
      return;
    }
    
    // Enhanced price detection with multiple patterns
    let foundPriceOnLine = false;
    
    // Pattern 1: Thai พิเศษ format (e.g., "40 พิเศษ 50") - NEW PRIORITY PATTERN
    patternsAttempted.push('thai-special-price-format');
    const thaiSpecialMatch = line.match(/(\d{2,4})\s*พิเศษ\s*(\d{2,4})/gi);
    if (thaiSpecialMatch && thaiSpecialMatch.length > 0) {
      const fullMatch = thaiSpecialMatch[0];
      const priceNumbers = fullMatch.match(/(\d{2,4})/g);
      if (priceNumbers && priceNumbers.length >= 2) {
        const regularPrice = priceNumbers[0];
        const specialPrice = priceNumbers[1];
        console.log(`💰 Found Thai พิเศษ price on line ${index}: "${line}" -> ${regularPrice}/${specialPrice} บาท`);
        priceLines.push({ index, price: regularPrice, line });
        foundPriceOnLine = true;
        
        patternResults.push({
          pattern: 'thai-special-price-format',
          matched: true,
          extractedData: { regularPrice, specialPrice, fullMatch }
        });
        
        // Check if the same line has a dish name
        const dishName = line.replace(fullMatch, '').trim();
        const cleanName = cleanDishName(dishName);
        if (cleanName && cleanName.length > 2 && hasThaiText(cleanName)) {
          console.log(`🍽️ Found dish with Thai พิเศษ price: "${cleanName}" -> ${regularPrice}/${specialPrice} บาท`);
          dishes.push({
            name: cleanName,
            price: `${regularPrice}/${specialPrice} บาท`,
            confidence: 0.95,
            category: categorizeByName(cleanName)
          });
          logDishResult({
            name: cleanName,
            price: `${regularPrice}/${specialPrice} บาท`,
            confidence: 0.95
          }, line, ['thai-special-price-same-line']);
        } else {
          // No dish name on same line, just record the price for later matching
          console.log(`💰 Found standalone Thai พิเศษ price: "${fullMatch}" - will match with nearby dish`);
          priceLines.push({ index, price: `${regularPrice}/${specialPrice}`, line });
        }
      }
    } else {
      patternResults.push({
        pattern: 'thai-special-price-format',
        matched: false,
        failureReason: 'No Thai พิเศษ price format found'
      });
    }

    // Pattern 2: Explicit price with currency - Fixed regex capture
    if (!foundPriceOnLine) {
      patternsAttempted.push('explicit-price-with-currency');
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
          
          patternResults.push({
            pattern: 'explicit-price-with-currency',
            matched: true,
            extractedData: { price, fullMatch }
          });
          
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
            logDishResult({
              name: cleanName,
              price: `${price} บาท`,
              confidence: 0.95
            }, line, ['explicit-price-same-line']);
          }
        }
      } else {
        patternResults.push({
          pattern: 'explicit-price-with-currency',
          matched: false,
          failureReason: 'No explicit price with currency found'
        });
      }
    }
    
    // Pattern 3: Multiple prices (e.g., "80/100/120") - Fixed regex capture
    if (!foundPriceOnLine) {
      patternsAttempted.push('multiple-prices-slash-separated');
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
          
          patternResults.push({
            pattern: 'multiple-prices-slash-separated',
            matched: true,
            extractedData: { validPrices, selectedPrice: validPrices[0] }
          });
          
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
            logDishResult({
              name: cleanName,
              price: `${validPrices.join('/')} บาท`,
              confidence: 0.90
            }, line, ['multiple-prices-same-line']);
          }
        } else {
          patternResults.push({
            pattern: 'multiple-prices-slash-separated',
            matched: false,
            failureReason: `Found ${validPrices.length} valid prices, need 2+`
          });
        }
      } else {
        patternResults.push({
          pattern: 'multiple-prices-slash-separated',
          matched: false,
          failureReason: 'No multiple price pattern found'
        });
      }
    }
    
    // Pattern 4: Standalone numbers that could be prices
    if (!foundPriceOnLine && hasThaiText(line)) {
      patternsAttempted.push('standalone-numbers-with-thai');
      const standaloneNumberMatches = Array.from(line.matchAll(thaiPatterns.standaloneNumbers));
      const validPriceNumbers = standaloneNumberMatches.filter(match => {
        const num = parseInt(match[1]);
        const numStr = match[1];
        
        // Exclude phone number segments
        const isPhoneNumber = /\d{3}-\d{7}|\d{10}/.test(line) || 
                             numStr.startsWith('0') || 
                             numStr.length > 3;
        
        return num >= 20 && num <= 2000 && !isPhoneNumber; // Reasonable price range, not phone
      });
      
      if (validPriceNumbers.length > 0) {
        const price = validPriceNumbers[0][1];
        console.log(`💰 Found potential price number on line ${index}: "${line}" -> ${price} (assumed บาท)`);
        priceLines.push({ index, price, line });
        
        patternResults.push({
          pattern: 'standalone-numbers-with-thai',
          matched: true,
          extractedData: { price, allNumbers: validPriceNumbers.map(m => m[1]) }
        });
        
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
          logDishResult({
            name: cleanName,
            price: `${price} บาท`,
            confidence: 0.80
          }, line, ['standalone-number-price']);
        }
      } else {
        patternResults.push({
          pattern: 'standalone-numbers-with-thai',
          matched: false,
          failureReason: `Found ${standaloneNumberMatches.length} numbers, none in valid price range or excluded phone numbers`
        });
      }
    }

    // Determine final line classification and log pattern matching details
    let classification: 'dish' | 'header' | 'price-only' | 'description' | 'other' = 'other';
    let classificationReason = 'Default classification';

    // Enhanced: More strict standalone price detection
    const isStandalonePriceLine = /^\d+\s*พิเศษ\s*\d+$/.test(line.trim()) || 
                                 /^[\d\s\/\-฿บาทพิเศษ,\.]+$/.test(line.trim()) ||
                                 (/^\d{2,4}[\/\-,]\d{2,4}[\/\-,]?\d{0,4}\s*(?:บาท|฿)?$/.test(line.trim())) ||
                                 (/^\d{2,4}$/.test(line.trim()) && line.length <= 4);

    if (isStandalonePriceLine) {
      classification = 'price-only';
      classificationReason = 'Standalone price line without dish name';
      console.log(`💰 Classified as price-only: "${line}"`);
    } else if (foundPriceOnLine) {
      // Remove all price patterns to check for remaining dish name
      let dishName = line.replace(/\d+\s*พิเศษ\s*\d+/g, '')
                         .replace(/\d+(?:[-\/,]\d+)*\s*(?:บาท|฿)/g, '')
                         .replace(/\d{2,4}/g, '')
                         .trim();
      const cleanName = cleanDishName(dishName);
      
      if (cleanName && cleanName.length > 2 && isLikelyDishName(cleanName) && hasThaiText(cleanName)) {
        classification = 'dish';
        classificationReason = 'Line contains price and valid dish name';
        console.log(`🍽️ Classified as dish with price: "${cleanName}" from "${line}"`);
      } else {
        classification = 'price-only';
        classificationReason = 'Line contains price but no valid dish name';
        console.log(`💰 Classified as price-only (no valid dish): "${line}"`);
        logRejectedLine(line, 'Contains price but no valid dish name after cleaning');
      }
    } else if (hasThaiText(line) && line.length > 3 && line.length < 100) {
      const cleanName = cleanDishName(line);
      if (cleanName && cleanName.length > 2 && isLikelyDishName(cleanName)) {
        classification = 'dish';
        classificationReason = 'Line contains likely dish name in Thai';
        console.log(`🍽️ Found potential dish name on line ${index}: "${cleanName}"`);
        dishNameCandidates.push({ index, name: cleanName, line });
      } else {
        classification = 'description';
        classificationReason = 'Thai text but not recognized as dish name';
        console.log(`📝 Classified as description: "${line}"`);
        logRejectedLine(line, 'Thai text but failed dish name validation');
      }
    } else if (!hasThaiText(line) && /\d/.test(line)) {
      classification = 'price-only';
      classificationReason = 'Contains numbers but no Thai text';
      console.log(`💰 Classified as price-only (no Thai): "${line}"`);
    }

    const isDishLine = classification === 'dish';

    // Log all pattern matching attempts for this line
    logPatternMatchingDetails(
      line,
      isDishLine,
      patternsAttempted,
      patternResults,
      classification,
      classificationReason
    );

    // Log price extraction failures if prices were found but not properly extracted
    if (!foundPriceOnLine && hasThaiText(line)) {
      const foundPrices = line.match(/\d{2,4}/g) || [];
      const validFoundPrices = foundPrices.filter(p => {
        const num = parseInt(p);
        return num >= 20 && num <= 2000;
      });
      
      if (validFoundPrices.length > 0) {
        logPriceExtractionFailure(
          line,
          validFoundPrices,
          undefined,
          'Found potential prices but no extraction pattern matched'
        );
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
      
      logDishResult({
        name: candidate.name,
        price: `${closestPrice.price} บาท`,
        confidence: Math.max(0.75, 0.95 - (distance * 0.05))
      }, candidate.line, ['nearby-price-match']);
    } else {
      // Enhanced price matching for special cases like "โจ๊กเปล่า" followed by "15"
      const nearbyLines = lines.slice(
        Math.max(0, candidate.index - 2), 
        Math.min(lines.length, candidate.index + 5)
      );
      
      let foundImplicitPrice = false;
      for (let i = 0; i < nearbyLines.length; i++) {
        const line = nearbyLines[i];
        const numbers = Array.from(line.matchAll(thaiPatterns.standaloneNumbers))
          .map(match => parseInt(match[1]))
          .filter(num => num >= 10 && num <= 500); // Expanded range for small prices like 10, 15
        
        // Check for number-only lines OR lines with minimal Thai text + numbers
        if (numbers.length > 0 && (line.trim().length <= 3 || !hasThaiText(line))) {
          // Found a line with just numbers - likely prices
          const price = numbers[0];
          console.log(`🔗 Matching "${candidate.name}" with implicit price ${price} บาท (from number-only line)`);
          
          dishes.push({
            name: candidate.name,
            price: `${price} บาท`,
            confidence: 0.75,
            category: categorizeByName(candidate.name)
          });
          
          logDishResult({
            name: candidate.name,
            price: `${price} บาท`,
            confidence: 0.75
          }, candidate.line, ['implicit-price-match']);
          
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
        
        logDishResult({
          name: candidate.name,
          price: "Price not detected",
          confidence: 0.60
        }, candidate.line, ['no-price-found']);
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
    'อาหาร', 'เครื่องดื่ม', 'ของหวาน', 'นายฮุย', 'porridge'
  ];
  
  const lowerLine = line.toLowerCase().trim();
  
  // Enhanced header detection
  const isExactHeader = headers.some(header => lowerLine === header.toLowerCase());
  const containsHeaderWord = headers.some(header => lowerLine.includes(header.toLowerCase()));
  const hasDecorations = /[•●▪▫★☆✭✳*·]/.test(line);
  const isBrandLine = line.includes('BY ') || /^[A-Z\s&]{3,15}$/.test(line.trim());
  const isMenuCategory = line.startsWith('เมนู') && line.length < 25;
  const isJustNumbers = /^[\d\s\/\-฿บาท]+$/.test(line.trim()) && !hasThaiText(line);
  
  // NEW: Detect phone numbers and restaurant names
  const hasPhoneNumber = /\d{3}-\d{7}|\d{10}/.test(line); // Thai phone format
  const isRestaurantName = line.includes('นายฮุย') || line.includes('Mr.') || 
                          (hasPhoneNumber && line.length < 50); // Restaurant name with phone
  
  // Debug logging for header detection
  if (isExactHeader || containsHeaderWord || hasDecorations || isBrandLine || isMenuCategory || isRestaurantName) {
    console.log(`🚨 Detected header line: "${line}" (exact: ${isExactHeader}, contains: ${containsHeaderWord}, decorations: ${hasDecorations}, brand: ${isBrandLine}, category: ${isMenuCategory}, restaurant: ${isRestaurantName})`);
  }
  
  return isExactHeader || hasDecorations || isBrandLine || isMenuCategory || isJustNumbers || isRestaurantName ||
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
  // Enhanced dish name validation to prevent false positives
  const tooGeneric = ['เมนู', 'ราคา', 'บาท', 'ร้าน', 'อาหาร', 'menu', 'price', 'restaurant', 'พิเศษ']; 
  const tooShort = name.length < 3;
  const tooLong = name.length > 80;
  
  // Exclude pure English promotional text or brand names
  const isEnglishPromo = /^[A-Z\s&]+$/.test(name) && name.includes(' ');
  
  // Enhanced: Exclude lines with only numbers, currency, or price-related terms
  const isOnlyPriceInfo = /^[\d\s\/\-฿บาทพิเศษ,\.]+$/.test(name);
  
  // Enhanced: Exclude standalone price patterns including comma-separated prices
  const isStandalonePriceWord = name.trim() === 'พิเศษ' || 
                               /^\d+\s*พิเศษ\s*\d+$/.test(name.trim()) ||
                               /^\d+[\s,\/\-]+\d+[\s,\/\-]*\d*\s*(?:บาท|฿)?$/.test(name.trim()) ||
                               /^\d{2,4}$/.test(name.trim()); // Just a number
  
  // Must contain Thai characters or be a reasonable dish name
  const hasThaiChars = /[ก-๙]/.test(name);
  
  // Exclude time patterns (like "10:00-22:00")
  const isTimePattern = /\d{1,2}:\d{2}/.test(name);
  
  // Exclude promotional phrases
  const isPromotional = /(โปรโมชั่น|ลดราคา|ฟรี|free|promotion|discount)/i.test(name);
  
  // Enhanced: Exclude payment method patterns
  const isPaymentMethod = /(qr|prompt\s*pay|pay|payment)/i.test(name);
  
  // Enhanced: More specific dish indicators for Thai food
  const hasDishIndicators = /(ข้าว|ก๋วยเตี๋ยว|ผัด|ทอด|ยำ|ต้ม|แกง|น้ำ|อาหาร|โจ๊ก|เกา|หมี่|บะหมี่|ไก่|หมู|เนื้อ|กุ้ง|ปลา|ไข่|เต้าหู้)/.test(name);
  
  // Enhanced: Require minimum meaningful content
  const hasMinimumContent = name.replace(/[\d\s\/\-฿บาทพิเศษ,\.]/g, '').length >= 2;
  
  const isValid = !tooShort && !tooLong && 
         !tooGeneric.some(generic => name.toLowerCase() === generic.toLowerCase()) &&
         !isEnglishPromo && !isOnlyPriceInfo && !isTimePattern && !isPromotional && 
         !isStandalonePriceWord && !isPaymentMethod && hasMinimumContent &&
         (hasThaiChars || hasDishIndicators);
  
  // Debug logging for dish name validation
  if (!isValid && hasThaiChars) {
    console.log(`🚨 Rejected potential dish name: "${name}" (short: ${tooShort}, long: ${tooLong}, generic: ${tooGeneric.some(g => name.toLowerCase() === g.toLowerCase())}, promo: ${isEnglishPromo}, priceOnly: ${isOnlyPriceInfo}, standalone: ${isStandalonePriceWord}, payment: ${isPaymentMethod}, minContent: ${hasMinimumContent}, time: ${isTimePattern}, promotional: ${isPromotional})`);
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
    // Enhanced duplicate detection with fuzzy matching
    const normalizedName = dish.name.toLowerCase()
      .replace(/[\s\-\(\)]/g, '') // Remove spaces, hyphens, parentheses
      .replace(/[ก-๙]/g, m => m.normalize('NFD')) // Normalize Thai characters
      .trim();
    
    // Additional check for very similar names (Levenshtein distance)
    let isDuplicate = false;
    let duplicateIndex = -1;
    
    for (let i = 0; i < unique.length; i++) {
      const existingNormalized = unique[i].name.toLowerCase()
        .replace(/[\s\-\(\)]/g, '')
        .replace(/[ก-๙]/g, m => m.normalize('NFD'))
        .trim();
      
      // Exact match or very similar (allowing for OCR variations)
      const similarity = calculateSimilarity(normalizedName, existingNormalized);
      if (normalizedName === existingNormalized || similarity > 0.85) {
        isDuplicate = true;
        duplicateIndex = i;
        break;
      }
    }
    
    if (!isDuplicate && !seen.has(normalizedName)) {
      seen.add(normalizedName);
      unique.push(dish);
      console.log(`✅ Added unique dish: "${dish.name}" (confidence: ${dish.confidence})`);
    } else if (isDuplicate && duplicateIndex >= 0) {
      // If duplicate found, keep the one with higher confidence
      if (dish.confidence > unique[duplicateIndex].confidence) {
        console.log(`🔄 Replacing duplicate "${unique[duplicateIndex].name}" (${unique[duplicateIndex].confidence}) with "${dish.name}" (${dish.confidence})`);
        unique[duplicateIndex] = dish;
      } else {
        console.log(`🚫 Skipping duplicate "${dish.name}" (${dish.confidence}) - keeping "${unique[duplicateIndex].name}" (${unique[duplicateIndex].confidence})`);
      }
    } else {
      console.log(`🚫 Skipping duplicate "${dish.name}" (normalized: "${normalizedName}")`);
    }
  }
  
  console.log(`📊 Final unique dishes: ${unique.length} from original ${dishes.length}`);
  return unique;
}

// Helper function to calculate string similarity
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
}

// Helper function to calculate Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
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