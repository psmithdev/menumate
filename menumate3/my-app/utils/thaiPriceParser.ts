// Enhanced Thai price parsing utilities
export interface ParsedPrice {
  price: string;
  currency?: string;
  size?: string;
  isMultipleSize?: boolean;
  allSizes?: { size: string; price: string }[];
}

export interface ThaiMenuLine {
  dishName: string;
  prices: ParsedPrice[];
  isValid: boolean;
  isDish: boolean; // New field to indicate if this is actually a dish
}

// Thai size indicators (both Thai and transliterated)
const THAI_SIZE_INDICATORS = {
  small: ['เล็ก', 'ขนาดเล็ก', 'S', 'small', 'mini', 'มินิ'],
  medium: ['กลาง', 'ปกติ', 'ธรรมดา', 'M', 'medium', 'regular', 'normal'],
  large: ['ใหญ่', 'ขนาดใหญ่', 'L', 'large', 'jumbo', 'จัมโบ้', 'พิเศษ', 'special'],
  extra: ['พิเศษ', 'extra', 'XL', 'XXL', 'jumbo', 'จัมโบ้', 'ยักษ์']
};

// Currency patterns for Thai menus
const CURRENCY_PATTERNS = {
  baht: /(?:฿|บาท|baht|THB)/i,
  usd: /(?:\$|USD|dollar|ดอลลาร์)/i,
  yen: /(?:¥|JPY|yen|เย็น)/i,
  euro: /(?:€|EUR|euro|ยูโร)/i,
  pound: /(?:£|GBP|pound|ปอนด์)/i
};

// Patterns to identify non-dish items (restaurant names, headers, categories, etc.)
const NON_DISH_PATTERNS = {
  // Restaurant names and headers
  restaurantNames: /(?:ร้าน|restaurant|cafe|coffee|shop|store|house|kitchen|food|court|center|market|plaza|mall|hall|อาหาร|ร้านอาหาร|ภัตตาคาร|โรงแรม|hotel)/i,
  
  // Menu categories and headers
  categories: /(?:menu|เมนู|รายการ|หมวด|ประเภท|category|section|appetizer|main|course|dessert|drink|beverage|soup|salad|rice|noodle|curry|stir|fried|grilled|steamed|เครื่องดื่ม|น้ำ|ข้าว|ก๋วยเตี๋ยว|แกง|ผัด|ทอด|ย่าง|นึ่ง|อบ|ต้ม|รวม)/i,
  
  // Size labels only (without dish names)
  sizeLabelsOnly: /^(?:เล็ก|กลาง|ใหญ่|ขนาดเล็ก|ขนาดกลาง|ขนาดใหญ่|S|M|L|small|medium|large|regular|normal|special|jumbo|จัมโบ้|พิเศษ|ปกติ|ธรรมดา)(?:\s*[\/\-\s]\s*(?:เล็ก|กลาง|ใหญ่|ขนาดเล็ก|ขนาดกลาง|ขนาดใหญ่|S|M|L|small|medium|large|regular|normal|special|jumbo|จัมโบ้|พิเศษ|ปกติ|ธรรมดา))*\s*$/i,
  
  // Time indicators
  timeOnly: /^(?:\d{1,2}:\d{2}|\d{1,2}\s*(?:am|pm|AM|PM|โมง|นาฬิกา|ชั่วโมง|นาที))\s*$/i,
  
  // Price lists without dish names
  priceListOnly: /^(?:\d+(?:[.,]\d{2})?\s*(?:บาท|฿|\$|€|£|¥)?(?:\s*[\/\-\s]\s*\d+(?:[.,]\d{2})?\s*(?:บาท|฿|\$|€|£|¥)?)*)\s*$/i,
  
  // Address and contact info
  contactInfo: /(?:tel|phone|fax|email|address|location|ที่อยู่|โทร|แฟกซ์|อีเมล|สถานที่|www|http|facebook|line|ig|instagram)/i,
  
  // Common non-food words
  nonFood: /(?:welcome|สวัสดี|ยินดีต้อนรับ|thank|you|ขอบคุณ|service|charge|tax|vat|ภาษี|ค่าบริการ|delivery|จัดส่ง|takeaway|กลับบ้าน|open|close|เปิด|ปิด|monday|tuesday|wednesday|thursday|friday|saturday|sunday|วันจันทร์|วันอังคาร|วันพุธ|วันพฤหัสบดี|วันศุกร์|วันเสาร์|วันอาทิตย์)/i,
  
  // Very short or single character lines
  tooShort: /^.{1,2}$/,
  
  // Only numbers or symbols
  numbersSymbolsOnly: /^[\d\s\-\+\*\/\(\)\.,:;!@#$%^&*=\[\]{}|\\<>?~`'"]*$/,
  
  // Promotional text and marketing slogans
  promotional: /(?:promotion|โปรโมชั่น|discount|ส่วนลด|special|offer|free|ฟรี|new|ใหม่|hot|popular|recommended|แนะนำ|hit|best|seller|top|favorite|โปรด|premium|พรีเมียม)/i,
  
  // Text in parentheses only (instructions, descriptions)
  parenthesesOnly: /^\s*\([^)]*\)\s*$/,
  
  // Text with asterisks (promotional/historical text)
  asteriskText: /^\s*\*.*$/,
  
  // Text with bullet points
  bulletPoints: /^\s*[•·▪▫◦‣⁃]\s*.*|.*\s*[•·▪▫◦‣⁃]\s*$/,
  
  // Exclamatory promotional text
  exclamatoryPromo: /^.*[!！]\s*$|^.*คิดดู[!！]?\s*$/,
  
  // Historical/story text patterns
  historicalText: /(?:สมัย|โบราณ|เก่า|แต่ก่อน|ในอดีต|ประวัติ|เรื่องราว|ตำนาน)/i,
  
  // Brand names with special characters
  brandNames: /(?:BY\s+|by\s+|โดย\s+).*|.*\s+(?:brand|แบรนด์)\s*$/i,
  
  // Incomplete words or fragments (less than 4 Thai characters and not complete words)
  incompleteText: /^[ก-๙]{1,3}$|^[a-zA-Z]{1,3}$/,
  
  // Technical or style descriptions
  styleDescriptions: /(?:ทรงเครื่อง|สไตล์|แบบ|รูปแบบ|วิธี|เทคนิค|ชาญ)/i,
  
  // Summary or total indicators
  summaryText: /^(?:รวม|total|sum|ทั้งหมด|รวมทั้งหมด|สรุป).*$/i
};

// Function to check if a line is likely to be a dish
function isDishLine(text: string): boolean {
  const trimmed = text.trim();
  
  // Check against non-dish patterns
  for (const pattern of Object.values(NON_DISH_PATTERNS)) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }
  
  // Must have some alphabetic characters (not just numbers/symbols)
  if (!/[a-zA-Zก-๙]/.test(trimmed)) {
    return false;
  }
  
  // Must have reasonable length (between 3-100 characters)
  if (trimmed.length < 3 || trimmed.length > 100) {
    return false;
  }
  
  // Should not be just size indicators
  const sizeWords = trimmed.split(/\s+/);
  const allSizeWords = sizeWords.every(word => {
    return Object.values(THAI_SIZE_INDICATORS).flat().some(size => 
      word.toLowerCase().includes(size.toLowerCase())
    );
  });
  
  if (allSizeWords) {
    return false;
  }
  
  return true;
}

// Enhanced price regex patterns for Thai menus with better debugging
const PRICE_PATTERNS = {
  // Pattern 1: Price at end with currency (e.g., "ข้าวผัดกุ้ง 120 บาท", "Tom Yum ฿85")
  priceAtEnd: /(.+?)\s+(\d{1,5}(?:[.,]\d{1,2})?)\s*([฿$€£¥]|บาท|baht|THB|USD|JPY|EUR|GBP)?$/i,
  
  // Pattern 2: Multiple sizes with prices (e.g., "ส้มตำ เล็ก 80 กลาง 100 ใหญ่ 120")
  multipleSizes: /(.+?)\s+(?:(?:เล็ก|ขนาดเล็ก|S|small)\s+(\d{1,5}(?:[.,]\d{1,2})?))?\s*(?:(?:กลาง|ปกติ|M|medium|regular)\s+(\d{1,5}(?:[.,]\d{1,2})?))?\s*(?:(?:ใหญ่|ขนาดใหญ่|L|large|jumbo|จัมโบ้|พิเศษ|special)\s+(\d{1,5}(?:[.,]\d{1,2})?))?\s*([฿$€£¥]|บาท|baht|THB|USD|JPY|EUR|GBP)?$/i,
  
  // Pattern 3: Size before price (e.g., "ก๋วยเตี๋ยว เล็ก 60 บาท")
  sizeBeforePrice: /(.+?)\s+(เล็ก|กลาง|ใหญ่|ขนาดเล็ก|ขนาดใหญ่|S|M|L|small|medium|large|regular|jumbo|จัมโบ้|พิเศษ|special)\s+(\d{1,5}(?:[.,]\d{1,2})?)\s*([฿$€£¥]|บาท|baht|THB|USD|JPY|EUR|GBP)?$/i,
  
  // Pattern 4: Price ranges (e.g., "ผัดไทย 80-120 บาท")
  priceRange: /(.+?)\s+(\d{1,5}(?:[.,]\d{1,2})?)\s*[-–—]\s*(\d{1,5}(?:[.,]\d{1,2})?)\s*([฿$€£¥]|บาท|baht|THB|USD|JPY|EUR|GBP)?$/i,
  
  // Pattern 5: Just numbers at end (e.g., "แกงเขียวหวาน 95")
  numbersOnly: /(.+?)\s+(\d{1,5}(?:[.,]\d{1,2})?)$/,
  
  // Pattern 6: Price with size in parentheses (e.g., "ข้าวผัด (เล็ก) 80 บาท")
  sizeInParentheses: /(.+?)\s*\(([^)]+)\)\s*(\d{1,5}(?:[.,]\d{1,2})?)\s*([฿$€£¥]|บาท|baht|THB|USD|JPY|EUR|GBP)?$/i,
  
  // Pattern 7: Multiple prices separated by slashes (e.g., "น้ำปลาหวาน 80/100/120")
  slashSeparated: /(.+?)\s+(\d{1,5}(?:[.,]\d{1,2})?(?:\/\d{1,5}(?:[.,]\d{1,2})?)+)\s*([฿$€£¥]|บาท|baht|THB|USD|JPY|EUR|GBP)?$/i,
  
  // Pattern 8: Numbers after Thai text with potential currency (more flexible)
  flexiblePrice: /([ก-๙\s]+?)\s*(\d{2,4})\s*([฿$€£¥]|บาท|baht)?\s*$/i,
  
  // Pattern 9: Price at beginning (e.g., "120 บาท ข้าวผัด")
  priceAtBeginning: /^(\d{1,5}(?:[.,]\d{1,2})?)\s*([฿$€£¥]|บาท|baht|THB)?\s+(.+)$/i
};

// Detect currency from text
function detectCurrency(text: string, priceText?: string): string {
  const fullText = `${text} ${priceText || ''}`.toLowerCase();
  
  if (CURRENCY_PATTERNS.baht.test(fullText)) return 'บาท';
  if (CURRENCY_PATTERNS.usd.test(fullText)) return '$';
  if (CURRENCY_PATTERNS.yen.test(fullText)) return '¥';
  if (CURRENCY_PATTERNS.euro.test(fullText)) return '€';
  if (CURRENCY_PATTERNS.pound.test(fullText)) return '£';
  
  // Default to Thai Baht if no currency detected
  return 'บาท';
}

// Normalize size text
function normalizeSize(sizeText: string): string {
  const size = sizeText.toLowerCase().trim();
  
  for (const [normalizedSize, variants] of Object.entries(THAI_SIZE_INDICATORS)) {
    if (variants.some(variant => size.includes(variant.toLowerCase()))) {
      return normalizedSize;
    }
  }
  
  return size;
}

// Parse multiple sizes from text
function parseMultipleSizes(dishName: string, pricesText: string, currency?: string): ParsedPrice[] {
  const prices: ParsedPrice[] = [];
  const sizeOrder = ['small', 'medium', 'large', 'extra'];
  
  // Handle slash-separated prices (e.g., "80/100/120")
  if (pricesText.includes('/')) {
    const priceNumbers = pricesText.split('/').map(p => p.trim());
    priceNumbers.forEach((price, index) => {
      if (price && /^\d+(?:[.,]\d{1,2})?$/.test(price)) {
        const size = sizeOrder[index] || `size${index + 1}`;
        prices.push({
          price: price + (currency ? ` ${currency}` : ''),
          currency,
          size,
          isMultipleSize: true
        });
      }
    });
    return prices;
  }
  
  // Handle explicit size mentions
  const sizeMatches = pricesText.match(/(?:เล็ก|ขนาดเล็ก|S|small)\s+(\d{1,5}(?:[.,]\d{1,2})?)|(?:กลาง|ปกติ|M|medium|regular)\s+(\d{1,5}(?:[.,]\d{1,2})?)|(?:ใหญ่|ขนาดใหญ่|L|large|jumbo|จัมโบ้|พิเศษ|special)\s+(\d{1,5}(?:[.,]\d{1,2})?)/gi);
  
  if (sizeMatches) {
    sizeMatches.forEach(match => {
      const sizePrice = match.match(/(\d{1,5}(?:[.,]\d{1,2})?)/);
      if (sizePrice) {
        const size = match.replace(/\d{1,5}(?:[.,]\d{1,2})?/, '').trim();
        prices.push({
          price: sizePrice[1] + (currency ? ` ${currency}` : ''),
          currency,
          size: normalizeSize(size),
          isMultipleSize: true
        });
      }
    });
  }
  
  return prices;
}

// Main Thai price parsing function with enhanced debugging
export function parseThaiMenuLine(line: string): ThaiMenuLine {
  const trimmedLine = line.trim();
  
  console.log(`🔍 Parsing line: "${trimmedLine}"`);
  
  if (!trimmedLine || trimmedLine.length < 2) {
    console.log(`❌ Line too short or empty`);
    return {
      dishName: '',
      prices: [],
      isValid: false,
      isDish: false
    };
  }
  
  // Check if this line is likely to be a dish
  const isDish = isDishLine(trimmedLine);
  console.log(`🍽️ Is dish line: ${isDish}`);
  
  if (!isDish) {
    console.log(`❌ Not recognized as dish line`);
    return {
      dishName: trimmedLine,
      prices: [],
      isValid: false,
      isDish: false
    };
  }
  
  // Try each pattern in order of specificity with detailed logging
  
  // 1. Multiple sizes pattern
  console.log(`🔍 Testing multiple sizes pattern...`);
  const multipleSizesMatch = PRICE_PATTERNS.multipleSizes.exec(trimmedLine);
  if (multipleSizesMatch) {
    console.log(`✅ Multiple sizes match found:`, multipleSizesMatch);
    const dishName = multipleSizesMatch[1].trim();
    const smallPrice = multipleSizesMatch[2];
    const mediumPrice = multipleSizesMatch[3];
    const largePrice = multipleSizesMatch[4];
    const currency = detectCurrency(trimmedLine, multipleSizesMatch[5]);
    
    const prices: ParsedPrice[] = [];
    if (smallPrice) prices.push({ price: `${smallPrice} ${currency}`, currency, size: 'small', isMultipleSize: true });
    if (mediumPrice) prices.push({ price: `${mediumPrice} ${currency}`, currency, size: 'medium', isMultipleSize: true });
    if (largePrice) prices.push({ price: `${largePrice} ${currency}`, currency, size: 'large', isMultipleSize: true });
    
    console.log(`💰 Extracted prices:`, prices);
    
    if (prices.length > 0) {
      console.log(`✅ Returning multiple sizes result for "${dishName}"`);
      return {
        dishName,
        prices: prices.map(p => ({ ...p, allSizes: prices.map(price => ({ size: price.size || '', price: price.price })) })),
        isValid: true,
        isDish: true
      };
    }
  }
  
  // 2. Slash-separated prices
  const slashSeparatedMatch = PRICE_PATTERNS.slashSeparated.exec(trimmedLine);
  if (slashSeparatedMatch) {
    const dishName = slashSeparatedMatch[1].trim();
    const pricesText = slashSeparatedMatch[2];
    const currency = detectCurrency(trimmedLine, slashSeparatedMatch[3]);
    
    const prices = parseMultipleSizes(dishName, pricesText, currency);
    if (prices.length > 0) {
      return {
        dishName,
        prices: prices.map(p => ({ ...p, allSizes: prices.map(price => ({ size: price.size || '', price: price.price })) })),
        isValid: true,
        isDish: true
      };
    }
  }
  
  // 3. Size in parentheses
  const sizeInParenthesesMatch = PRICE_PATTERNS.sizeInParentheses.exec(trimmedLine);
  if (sizeInParenthesesMatch) {
    const dishName = sizeInParenthesesMatch[1].trim();
    const sizeText = sizeInParenthesesMatch[2];
    const priceText = sizeInParenthesesMatch[3];
    const currency = detectCurrency(trimmedLine, sizeInParenthesesMatch[4]);
    
    return {
      dishName,
      prices: [{
        price: `${priceText} ${currency}`,
        currency,
        size: normalizeSize(sizeText),
        isMultipleSize: false
      }],
      isValid: true,
      isDish: true
    };
  }
  
  // 4. Size before price
  const sizeBeforePriceMatch = PRICE_PATTERNS.sizeBeforePrice.exec(trimmedLine);
  if (sizeBeforePriceMatch) {
    const dishName = sizeBeforePriceMatch[1].trim();
    const sizeText = sizeBeforePriceMatch[2];
    const priceText = sizeBeforePriceMatch[3];
    const currency = detectCurrency(trimmedLine, sizeBeforePriceMatch[4]);
    
    return {
      dishName,
      prices: [{
        price: `${priceText} ${currency}`,
        currency,
        size: normalizeSize(sizeText),
        isMultipleSize: false
      }],
      isValid: true,
      isDish: true
    };
  }
  
  // 5. Price range
  const priceRangeMatch = PRICE_PATTERNS.priceRange.exec(trimmedLine);
  if (priceRangeMatch) {
    const dishName = priceRangeMatch[1].trim();
    const minPrice = priceRangeMatch[2];
    const maxPrice = priceRangeMatch[3];
    const currency = detectCurrency(trimmedLine, priceRangeMatch[4]);
    
    return {
      dishName,
      prices: [{
        price: `${minPrice}-${maxPrice} ${currency}`,
        currency,
        isMultipleSize: false
      }],
      isValid: true,
      isDish: true
    };
  }
  
  // 6. Standard price at end
  const priceAtEndMatch = PRICE_PATTERNS.priceAtEnd.exec(trimmedLine);
  if (priceAtEndMatch) {
    const dishName = priceAtEndMatch[1].trim();
    const priceText = priceAtEndMatch[2];
    const currency = detectCurrency(trimmedLine, priceAtEndMatch[3]);
    
    return {
      dishName,
      prices: [{
        price: `${priceText} ${currency}`,
        currency,
        isMultipleSize: false
      }],
      isValid: true,
      isDish: true
    };
  }
  
  // 7. Numbers only at end
  console.log(`🔍 Testing numbers only pattern...`);
  const numbersOnlyMatch = PRICE_PATTERNS.numbersOnly.exec(trimmedLine);
  if (numbersOnlyMatch) {
    console.log(`✅ Numbers only match found:`, numbersOnlyMatch);
    const dishName = numbersOnlyMatch[1].trim();
    const priceText = numbersOnlyMatch[2];
    const currency = detectCurrency(trimmedLine);
    
    console.log(`💰 Extracted: dish="${dishName}", price="${priceText}", currency="${currency}"`);
    
    return {
      dishName,
      prices: [{
        price: `${priceText} ${currency}`,
        currency,
        isMultipleSize: false
      }],
      isValid: true,
      isDish: true
    };
  }
  
  // 8. Flexible price pattern (more lenient)
  console.log(`🔍 Testing flexible price pattern...`);
  const flexiblePriceMatch = PRICE_PATTERNS.flexiblePrice.exec(trimmedLine);
  if (flexiblePriceMatch) {
    console.log(`✅ Flexible price match found:`, flexiblePriceMatch);
    const dishName = flexiblePriceMatch[1].trim();
    const priceText = flexiblePriceMatch[2];
    const currency = detectCurrency(trimmedLine, flexiblePriceMatch[3]);
    
    // Validate that the price is reasonable
    const priceNum = parseInt(priceText);
    if (priceNum >= 15 && priceNum <= 3000) {
      console.log(`💰 Valid flexible price: dish="${dishName}", price="${priceText}", currency="${currency}"`);
      return {
        dishName,
        prices: [{
          price: `${priceText} ${currency}`,
          currency,
          isMultipleSize: false
        }],
        isValid: true,
        isDish: true
      };
    } else {
      console.log(`❌ Price ${priceNum} out of reasonable range`);
    }
  }
  
  // 9. Price at beginning
  console.log(`🔍 Testing price at beginning pattern...`);
  const priceAtBeginningMatch = PRICE_PATTERNS.priceAtBeginning.exec(trimmedLine);
  if (priceAtBeginningMatch) {
    console.log(`✅ Price at beginning match found:`, priceAtBeginningMatch);
    const priceText = priceAtBeginningMatch[1];
    const currency = detectCurrency(trimmedLine, priceAtBeginningMatch[2]);
    const dishName = priceAtBeginningMatch[3].trim();
    
    return {
      dishName,
      prices: [{
        price: `${priceText} ${currency}`,
        currency,
        isMultipleSize: false
      }],
      isValid: true,
      isDish: true
    };
  }
  
  // If no price pattern matches, return dish name with no price
  console.log(`❌ No price pattern matched for "${trimmedLine}"`);
  return {
    dishName: trimmedLine,
    prices: [],
    isValid: false,
    isDish: true
  };
}

// Helper function to get the best price for display
export function getBestPriceForDisplay(prices: ParsedPrice[]): string {
  if (prices.length === 0) return "Price not detected";
  
  if (prices.length === 1) {
    return prices[0].price;
  }
  
  // If multiple prices, show range or most common size
  const mediumPrice = prices.find(p => p.size === 'medium');
  if (mediumPrice) return mediumPrice.price;
  
  const smallPrice = prices.find(p => p.size === 'small');
  if (smallPrice) return smallPrice.price;
  
  // Show first price if no specific size found
  return prices[0].price;
}

// Helper function to format all prices for display
export function formatAllPrices(prices: ParsedPrice[]): string {
  if (prices.length === 0) return "Price not detected";
  
  if (prices.length === 1) {
    return prices[0].size ? 
      `${prices[0].size}: ${prices[0].price}` : 
      prices[0].price;
  }
  
  // Format multiple prices
  return prices.map(p => 
    p.size ? `${p.size}: ${p.price}` : p.price
  ).join(', ');
}