import type { ParsedDish } from "@/types/menu";
import { analyzeDish } from "./dishParser";

/**
 * Enhanced dish parser that uses OCR context and multiple languages
 * to better extract ingredients and dish details
 */
export interface EnhancedDishData {
  allergens: string[];
  ingredients: string[];
  originalLanguageName?: string;
  restaurantInfo?: {
    name?: string;
    location?: string;
    cuisine?: string;
  };
  confidence: number;
}

export function enhanceDishWithOCR(
  dish: ParsedDish, 
  ocrText?: string,
  detectedLanguage?: string
): ParsedDish & EnhancedDishData {
  
  const analysis = analyzeDish(dish.originalName, detectedLanguage || 'chinese');
  
  // Enhanced ingredient extraction from OCR context
  const enhancedIngredients = extractIngredientsFromContext(
    dish.originalName, 
    ocrText, 
    analysis.ingredients
  );

  // Extract allergens from ingredients
  const allergens = extractAllergens(enhancedIngredients);

  // Try to find restaurant info from OCR
  const restaurantInfo = extractRestaurantInfo(ocrText);

  // Determine original language name structure
  const originalLanguageName = determineOriginalLanguageName(dish.originalName, detectedLanguage);

  return {
    ...dish,
    ingredients: enhancedIngredients,
    allergens,
    originalLanguageName,
    restaurantInfo,
    confidence: calculateConfidence(dish, ocrText, enhancedIngredients),
    // Override with enhanced analysis
    calories: analysis.estimatedCalories,
    protein: analysis.estimatedProtein,
    time: analysis.cookingTime,
    isVegetarian: analysis.isVegetarian,
    isVegan: analysis.isVegan,
    isGlutenFree: analysis.isGlutenFree,
    isDairyFree: analysis.isDairyFree,
    isNutFree: analysis.isNutFree,
    spiceLevel: analysis.spiceLevel,
    tags: [...dish.tags, ...analysis.tags].filter((tag, index, arr) => 
      arr.indexOf(tag) === index // Remove duplicates
    )
  };
}

function extractIngredientsFromContext(
  dishName: string, 
  ocrText?: string, 
  baseIngredients: string[] = []
): string[] {
  if (!ocrText) return baseIngredients;

  const ingredients = new Set(baseIngredients);
  const dishNameLower = dishName.toLowerCase();
  const ocrLines = ocrText.split('\n');

  // Find the line containing this dish
  const dishLine = ocrLines.find(line => 
    line.toLowerCase().includes(dishNameLower.slice(0, 5)) // Match first few characters
  );

  if (!dishLine) return Array.from(ingredients);

  // Common ingredients patterns in multiple languages
  const ingredientPatterns = [
    // English patterns
    /with\s+([^,\n]+)/gi,
    /contains?\s+([^,\n]+)/gi,
    /made\s+with\s+([^,\n]+)/gi,
    
    // Chinese patterns (common ingredients)
    /(牛肉|猪肉|鸡肉|羊肉|鱼肉|虾|蟹|豆腐|蘑菇|青菜|白菜|菠菜|土豆|胡萝卜|洋葱|大蒜|生姜|辣椒|花椒|八角|桂皮|香菜|芹菜|韭菜|豆芽|竹笋|木耳|银耳|莲藕|冬瓜|南瓜|茄子|西红柿|黄瓜|豆角|豌豆|蚕豆|红豆|绿豆|花生|核桃|芝麻|大米|小米|面条|饺子|包子|馒头|油条|豆浆|牛奶|鸡蛋|鸭蛋|咸鸭蛋|松花蛋)/g,
    
    // Thai patterns (common ingredients)
    /(หมู|ไก่|เนื้อ|ปลา|กุ้ง|ปู|เต้าหู้|เห็ด|ผัก|กะหล่ำ|ผักกาด|มันฝรั่ง|หอม|กระเทียม|ขิง|พริก|ผักชี|ข้าว|เส้น|น้ำปลา|น้ำตาล|เกลือ)/g
  ];

  // Extract ingredients using patterns
  ingredientPatterns.forEach(pattern => {
    const matches = dishLine.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Clean up the match
        const cleaned = match
          .replace(/^(with|contains?|made with)\s+/i, '')
          .replace(/[,，。]/g, '')
          .trim();
        
        if (cleaned && cleaned.length > 1) {
          ingredients.add(cleaned);
        }
      });
    }
  });

  // Look for ingredients in parentheses or brackets
  const parenthesesMatches = dishLine.match(/[（(][^）)]+[）)]/g);
  if (parenthesesMatches) {
    parenthesesMatches.forEach(match => {
      const content = match.replace(/[（()）]/g, '').trim();
      if (content && content.length > 1 && content.length < 30) {
        // Split by common separators and add each part
        content.split(/[,，、\/]/).forEach(ingredient => {
          const cleaned = ingredient.trim();
          if (cleaned && cleaned.length > 1) {
            ingredients.add(cleaned);
          }
        });
      }
    });
  }

  return Array.from(ingredients).slice(0, 10); // Limit to 10 ingredients
}

function extractAllergens(ingredients: string[]): string[] {
  const allergens = new Set<string>();
  
  const allergenMap = {
    // Gluten
    'gluten': ['wheat', 'flour', 'bread', 'noodles', 'pasta', '面', '面条', '面粉', 'เส้น'],
    // Dairy
    'dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', '牛奶', '奶酪', '黄油', 'นม', 'เนย'],
    // Eggs
    'eggs': ['egg', 'eggs', '鸡蛋', '蛋', 'ไข่'],
    // Nuts
    'nuts': ['peanut', 'walnut', 'almond', 'cashew', '花生', '核桃', '杏仁', '腰果', 'ถั่ว'],
    // Shellfish
    'shellfish': ['shrimp', 'crab', 'lobster', 'oyster', '虾', '蟹', '龙虾', '牡蛎', 'กุ้ง', 'ปู'],
    // Soy
    'soy': ['soy', 'tofu', 'soybean', '豆', '豆腐', '黄豆', 'เต้าหู้'],
    // Fish
    'fish': ['fish', 'salmon', 'tuna', '鱼', 'ปลา']
  };

  const ingredientsLower = ingredients.map(i => i.toLowerCase());
  
  Object.entries(allergenMap).forEach(([allergen, indicators]) => {
    if (indicators.some(indicator => 
      ingredientsLower.some(ingredient => ingredient.includes(indicator))
    )) {
      allergens.add(allergen);
    }
  });

  return Array.from(allergens);
}

function extractRestaurantInfo(ocrText?: string): { name?: string; location?: string; cuisine?: string } | undefined {
  if (!ocrText) return undefined;

  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Usually restaurant name is in the first few lines
  const potentialName = lines.slice(0, 3).find(line => {
    // Skip lines that look like addresses or phone numbers
    return line.length > 3 && 
           line.length < 50 && 
           !line.match(/^\d+/) && // Not starting with numbers
           !line.includes('@') && // Not an email
           !line.match(/\d{3,}/) && // Not containing long numbers
           !line.includes('menu') && // Not the word menu
           !line.includes('菜单') && // Not Chinese for menu
           !line.includes('เมนู'); // Not Thai for menu
  });

  // Try to detect cuisine type from text
  const cuisineIndicators = {
    'Chinese': ['中式', '中国', '中餐', '川菜', '粤菜', '湘菜', '鲁菜'],
    'Thai': ['泰式', '泰国', 'ไทย', 'อาหารไทย'],
    'Italian': ['Italian', 'Pasta', 'Pizza'],
    'Japanese': ['日式', '日本', '寿司', 'すし', 'ラーメン'],
    'Indian': ['印度', 'Indian', 'Curry']
  };

  let detectedCuisine: string | undefined;
  const textLower = ocrText.toLowerCase();
  
  Object.entries(cuisineIndicators).forEach(([cuisine, indicators]) => {
    if (indicators.some(indicator => textLower.includes(indicator.toLowerCase()))) {
      detectedCuisine = cuisine;
    }
  });

  const result: { name?: string; location?: string; cuisine?: string } = {};
  
  if (potentialName) result.name = potentialName;
  if (detectedCuisine) result.cuisine = detectedCuisine;

  return Object.keys(result).length > 0 ? result : undefined;
}

function determineOriginalLanguageName(dishName: string, detectedLanguage?: string): string | undefined {
  // If dish name contains non-Latin characters, it's likely the original language name
  if (/[\u4e00-\u9fff\u0e00-\u0e7f]/.test(dishName)) {
    return dishName;
  }
  
  // Could also check against detected language patterns
  return undefined;
}

function calculateConfidence(
  dish: ParsedDish, 
  ocrText?: string, 
  ingredients: string[] = []
): number {
  let confidence = 0.5; // Base confidence
  
  // Increase confidence based on available data
  if (dish.originalPrice && dish.originalPrice !== "Price not detected") confidence += 0.2;
  if (ingredients.length > 0) confidence += 0.1;
  if (ingredients.length > 3) confidence += 0.1;
  if (dish.description && dish.description.length > 10) confidence += 0.1;
  if (ocrText && ocrText.length > 50) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

/**
 * Batch enhance multiple dishes with shared OCR context
 */
export function enhanceMultipleDishes(
  dishes: ParsedDish[],
  ocrText?: string,
  detectedLanguage?: string
): (ParsedDish & EnhancedDishData)[] {
  return dishes.map(dish => enhanceDishWithOCR(dish, ocrText, detectedLanguage));
}