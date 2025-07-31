// Menu validation and hallucination detection utilities

export interface DishValidationResult {
  isValid: boolean;
  reason?: string;
}

export function validateDish(dish: any): DishValidationResult {
  const name = dish.name?.toString() || '';
  const price = dish.price?.toString() || '';
  const nameLength = name.length;
  
  // Extract price number for validation
  const priceNumber = parseInt(price.match(/\d+/)?.[0] || '0');

  // Check name length constraints
  if (nameLength < 3) {
    return { isValid: false, reason: 'Name too short' };
  }
  
  if (nameLength > 100) {
    return { isValid: false, reason: 'Name too long' };
  }

  // Check for repeated character patterns (hallucination indicator)
  if (name.includes('ๆๆๆ') || name.includes('...')) {
    return { isValid: false, reason: 'Repeated character pattern' };
  }

  // Check for unrealistic prices
  if (priceNumber > 1000) {
    return { isValid: false, reason: 'Price too high' };
  }

  // Detect AI hallucination patterns
  if (isHallucinatedDish(name)) {
    return { isValid: false, reason: 'Detected hallucination pattern' };
  }

  return { isValid: true };
}

export function isHallucinatedDish(dishName: string): boolean {
  const name = dishName.toLowerCase();
  
  // Detect systematic AI-generated variations
  const hallucinationPatterns = [
    /พิเศษ\s*[abcdefg]/i,    // พิเศษ A, พิเศษ B, etc.
    /พิเศษพิเศษ/i,           // พิเศษพิเศษ (repetitive)
    /special\s*[abcdefg]/i,   // special A, special B, etc.
    /premium\s*[abcdefg]/i,   // premium A, premium B, etc.
  ];

  return hallucinationPatterns.some(pattern => pattern.test(name));
}

export function validateMenuResult(result: any): {
  isValid: boolean;
  filteredDishes: any[];
  rejectedCount: number;
  rejectionReasons: Record<string, number>;
} {
  const rejectionReasons: Record<string, number> = {};
  const validDishes: any[] = [];
  let rejectedCount = 0;

  // Validate each dish
  result.dishes?.forEach((dish: any) => {
    const validation = validateDish(dish);
    
    if (validation.isValid) {
      validDishes.push(dish);
    } else {
      rejectedCount++;
      const reason = validation.reason || 'Unknown';
      rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
      console.log(`🚫 Rejected dish: "${dish.name}" - ${reason}`);
    }
  });

  // Check for minimum dish count for complex menus
  const hasComplexMenuPattern = result.totalDishes > 15 || 
    validDishes.some((d: any) => d.price?.includes('/')) || // Range prices
    validDishes.some((d: any) => d.name?.includes('ข้าว')); // Rice dishes (common in Thai)

  if (hasComplexMenuPattern && validDishes.length < 10) {
    console.warn(`⚠️ Complex menu detected but only ${validDishes.length} dishes found. Expected 10+`);
    // For TDD: Reject results with too few dishes for complex menus
    return {
      isValid: false,
      filteredDishes: [],
      rejectedCount: result.dishes?.length || 0,
      rejectionReasons: { 'insufficient_dishes_for_complex_menu': validDishes.length }
    };
  }

  return {
    isValid: validDishes.length > 0,
    filteredDishes: validDishes.slice(0, 20), // Limit to 20 dishes max
    rejectedCount,
    rejectionReasons
  };
}

export function detectMenuContext(dishes: any[]): {
  context: string;
  confidence: number;
  indicators: string[];
} {
  const dishNames = dishes.map(d => d.name?.toLowerCase() || '');
  const allText = dishNames.join(' ');
  
  const indicators: string[] = [];
  let context = 'unknown';
  let confidence = 0;

  // Detect pork leg restaurant context
  if (allText.includes('ขาหมู') || allText.includes('pork leg')) {
    context = 'pork-leg';
    confidence += 0.8;
    indicators.push('pork leg dishes');
  }

  // Detect Thai context
  if (dishNames.some(name => /[ก-๙]/.test(name))) {
    confidence += 0.2;
    indicators.push('Thai text');
  }

  // Detect crispy pork context (different from pork leg)
  if (allText.includes('หมูกรอบ') || allText.includes('crispy pork')) {
    if (context === 'pork-leg') {
      // Conflicting contexts - this might be wrong
      confidence = 0.3;
      indicators.push('conflicting pork contexts');
    } else {
      context = 'crispy-pork';
      confidence += 0.7;
      indicators.push('crispy pork dishes');
    }
  }

  return { context, confidence, indicators };
}

export function validateMenuContext(dishes: any[], expectedContext?: string): boolean {
  if (!expectedContext) return true;
  
  const detected = detectMenuContext(dishes);
  
  if (expectedContext === 'pork-leg' && detected.context === 'crispy-pork') {
    console.warn('🚨 Wrong menu context: Expected pork leg, got crispy pork');
    return false;
  }

  return detected.confidence > 0.6;
}