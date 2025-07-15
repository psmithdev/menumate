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

// Enhanced price regex patterns for Thai menus
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
  slashSeparated: /(.+?)\s+(\d{1,5}(?:[.,]\d{1,2})?(?:\/\d{1,5}(?:[.,]\d{1,2})?)+)\s*([฿$€£¥]|บาท|baht|THB|USD|JPY|EUR|GBP)?$/i
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

// Main Thai price parsing function
export function parseThaiMenuLine(line: string): ThaiMenuLine {
  const trimmedLine = line.trim();
  
  if (!trimmedLine || trimmedLine.length < 2) {
    return {
      dishName: '',
      prices: [],
      isValid: false
    };
  }
  
  // Try each pattern in order of specificity
  
  // 1. Multiple sizes pattern
  const multipleSizesMatch = PRICE_PATTERNS.multipleSizes.exec(trimmedLine);
  if (multipleSizesMatch) {
    const dishName = multipleSizesMatch[1].trim();
    const smallPrice = multipleSizesMatch[2];
    const mediumPrice = multipleSizesMatch[3];
    const largePrice = multipleSizesMatch[4];
    const currency = detectCurrency(trimmedLine, multipleSizesMatch[5]);
    
    const prices: ParsedPrice[] = [];
    if (smallPrice) prices.push({ price: `${smallPrice} ${currency}`, currency, size: 'small', isMultipleSize: true });
    if (mediumPrice) prices.push({ price: `${mediumPrice} ${currency}`, currency, size: 'medium', isMultipleSize: true });
    if (largePrice) prices.push({ price: `${largePrice} ${currency}`, currency, size: 'large', isMultipleSize: true });
    
    if (prices.length > 0) {
      return {
        dishName,
        prices: prices.map(p => ({ ...p, allSizes: prices })),
        isValid: true
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
        prices: prices.map(p => ({ ...p, allSizes: prices })),
        isValid: true
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
      isValid: true
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
      isValid: true
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
      isValid: true
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
      isValid: true
    };
  }
  
  // 7. Numbers only at end
  const numbersOnlyMatch = PRICE_PATTERNS.numbersOnly.exec(trimmedLine);
  if (numbersOnlyMatch) {
    const dishName = numbersOnlyMatch[1].trim();
    const priceText = numbersOnlyMatch[2];
    const currency = detectCurrency(trimmedLine);
    
    return {
      dishName,
      prices: [{
        price: `${priceText} ${currency}`,
        currency,
        isMultipleSize: false
      }],
      isValid: true
    };
  }
  
  // If no price pattern matches, return dish name with no price
  return {
    dishName: trimmedLine,
    prices: [],
    isValid: false
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