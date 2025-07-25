import { 
  INGREDIENT_DB,
  getAllMeatIndicators,
  getAllVegetableIndicators,
  getAllDairyIndicators,
  getAllNutIndicators,
  getAllGlutenIndicators
} from './ingredientDatabase';

export interface DishAnalysis {
  ingredients: string[];
  spiceLevel: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  tags: string[];
  estimatedCalories: number;
  estimatedProtein: string;
  cookingTime: string;
  cuisine: string;
}

export function analyzeDish(
  dishName: string,
  cuisine: string = "chinese"
): DishAnalysis {
  const name = dishName.toLowerCase();

  // Extract ingredients
  const ingredients = extractIngredients(name, cuisine);

  // Determine spice level
  const spiceLevel = determineSpiceLevel(name);

  // Check dietary restrictions
  const isVegetarian = checkVegetarian(name, ingredients);
  const isVegan = checkVegan(name, ingredients);
  const isGlutenFree = checkGlutenFree(name, ingredients);
  const isDairyFree = checkDairyFree(name, ingredients);
  const isNutFree = checkNutFree(name, ingredients);

  // Generate tags
  const tags = generateTags(name, ingredients, spiceLevel, isVegetarian, isVegan, isGlutenFree, isDairyFree, isNutFree);

  // Estimate nutrition
  const estimatedCalories = estimateCalories(ingredients, isVegetarian);
  const estimatedProtein = estimateProtein(ingredients, isVegetarian);

  // Estimate cooking time
  const cookingTime = estimateCookingTime(ingredients, cuisine);

  return {
    ingredients,
    spiceLevel,
    isVegetarian,
    isVegan,
    isGlutenFree,
    isDairyFree,
    isNutFree,
    tags,
    estimatedCalories,
    estimatedProtein,
    cookingTime,
    cuisine,
  };
}

function extractIngredients(dishName: string, cuisine: string): string[] {
  const ingredients: string[] = [];
  const name = dishName.toLowerCase();

  // Check for meat ingredients
  const meatIngredients = getAllMeatIndicators();
  meatIngredients.forEach((ingredient) => {
    if (name.includes(ingredient.toLowerCase())) {
      ingredients.push(ingredient);
    }
  });

  // Check for vegetable ingredients
  const vegetableIngredients = getAllVegetableIndicators();
  vegetableIngredients.forEach((ingredient) => {
    if (name.includes(ingredient.toLowerCase())) {
      ingredients.push(ingredient);
    }
  });

  // Check for dairy ingredients
  const dairyIngredients = getAllDairyIndicators();
  dairyIngredients.forEach((ingredient) => {
    if (name.includes(ingredient.toLowerCase())) {
      ingredients.push(ingredient);
    }
  });

  // Check for nut ingredients
  const nutIngredients = getAllNutIndicators();
  nutIngredients.forEach((ingredient) => {
    if (name.includes(ingredient.toLowerCase())) {
      ingredients.push(ingredient);
    }
  });

  // Add common base ingredients if none found
  if (ingredients.length === 0) {
    ingredients.push("rice", "vegetables");
  }

  return ingredients;
}

function determineSpiceLevel(dishName: string): number {
  const name = dishName.toLowerCase();

  if (INGREDIENT_DB.spices.very_hot.some((indicator) => name.includes(indicator.toLowerCase()))) {
    return 4;
  } else if (
    INGREDIENT_DB.spices.hot.some((indicator) => name.includes(indicator.toLowerCase()))
  ) {
    return 3;
  } else if (
    INGREDIENT_DB.spices.medium.some((indicator) => name.includes(indicator.toLowerCase()))
  ) {
    return 2;
  } else if (
    INGREDIENT_DB.spices.mild.some((indicator) => name.includes(indicator.toLowerCase()))
  ) {
    return 1;
  }

  return 0; // Default to no spice detected
}

function checkVegetarian(dishName: string, ingredients: string[]): boolean {
  const name = dishName.toLowerCase();

  // Debug logging
  console.log(`Checking vegetarian for: "${dishName}", ingredients:`, ingredients);

  // Check for meat indicators FIRST - meat always takes precedence
  const meatIndicators = getAllMeatIndicators();
  const hasMeatInName = meatIndicators.some((indicator) => 
    name.includes(indicator.toLowerCase())
  );
  
  if (hasMeatInName) {
    console.log(`  -> FALSE: Found meat indicator in name`);
    return false;
  }

  // Check ingredients for meat - if found, not vegetarian
  const hasMeatInIngredients = ingredients.some((ingredient) =>
    meatIndicators.some(meat => ingredient.toLowerCase().includes(meat.toLowerCase()))
  );

  if (hasMeatInIngredients) {
    console.log(`  -> FALSE: Found meat in ingredients`);
    return false;
  }

  // Check for vegetarian indicators
  const vegetableIndicators = getAllVegetableIndicators();
  const hasVegInName = vegetableIndicators.some((indicator) => 
    name.includes(indicator.toLowerCase())
  );
  
  // Special case: egg dishes are vegetarian (蛋 but not in meat context)
  const hasEggDish = name.includes('蛋') && !hasMeatInName;

  const isVegetarian = hasVegInName || hasEggDish;

  console.log(`  -> ${isVegetarian ? 'TRUE' : 'FALSE'}: Vegetarian indicator check`);
  return isVegetarian;
}

function checkVegan(dishName: string, ingredients: string[]): boolean {
  const name = dishName.toLowerCase();

  // Only return true if explicitly marked as vegan
  if (name.includes("vegan") || name.includes("純素") || name.includes("纯素")) {
    return true;
  }

  // If not explicitly vegan, return false (conservative approach)
  return false;
}

function checkGlutenFree(dishName: string, ingredients: string[]): boolean {
  const name = dishName.toLowerCase();

  // Check for explicit gluten-free marking
  if (name.includes("gluten-free") || name.includes("gluten free") || name.includes("無麩質") || name.includes("无麸质")) {
    return true;
  }

  // Check for gluten-containing ingredients - if found, not gluten-free
  const glutenIndicators = getAllGlutenIndicators();
  const hasGluten = glutenIndicators.some((indicator) => 
    name.includes(indicator.toLowerCase())
  ) || ingredients.some((ingredient) =>
    glutenIndicators.some(gluten => ingredient.toLowerCase().includes(gluten.toLowerCase()))
  );

  // If gluten detected, definitely not gluten-free
  if (hasGluten) {
    return false;
  }

  // Conservative: only return true if explicitly marked
  return false;
}

function checkDairyFree(dishName: string, ingredients: string[]): boolean {
  const name = dishName.toLowerCase();

  // Check for explicit dairy-free marking
  if (name.includes("dairy-free") || name.includes("dairy free") || name.includes("無乳製品") || name.includes("无乳制品")) {
    return true;
  }

  // Check for dairy ingredients - if found, not dairy-free
  const dairyIndicators = getAllDairyIndicators();
  const hasDairy = dairyIndicators.some((indicator) => 
    name.includes(indicator.toLowerCase())
  ) || ingredients.some((ingredient) =>
    dairyIndicators.some(dairy => ingredient.toLowerCase().includes(dairy.toLowerCase()))
  );

  // If dairy detected, definitely not dairy-free
  if (hasDairy) {
    return false;
  }

  // Conservative: only return true if explicitly marked
  return false;
}

function checkNutFree(dishName: string, ingredients: string[]): boolean {
  const name = dishName.toLowerCase();

  // Check for explicit nut-free marking
  if (name.includes("nut-free") || name.includes("nut free") || name.includes("無堅果") || name.includes("无坚果")) {
    return true;
  }

  // Check for nut ingredients - if found, not nut-free
  const nutIndicators = getAllNutIndicators();
  const hasNuts = nutIndicators.some((indicator) => 
    name.includes(indicator.toLowerCase())
  ) || ingredients.some((ingredient) =>
    nutIndicators.some(nut => ingredient.toLowerCase().includes(nut.toLowerCase()))
  );

  // If nuts detected, definitely not nut-free
  if (hasNuts) {
    return false;
  }

  // Conservative: only return true if explicitly marked
  return false;
}

function generateTags(
  dishName: string,
  ingredients: string[],
  spiceLevel: number,
  isVegetarian: boolean,
  isVegan: boolean,
  isGlutenFree: boolean,
  isDairyFree: boolean,
  isNutFree: boolean
): string[] {
  const tags: string[] = [];
  const name = dishName.toLowerCase();

  // Add spice tags only when explicitly detected (not default 0)
  if (spiceLevel >= 3) {
    tags.push("Spicy");
  } else if (spiceLevel === 1 && INGREDIENT_DB.spices.mild.some(indicator => name.includes(indicator.toLowerCase()))) {
    tags.push("Mild");
  }

  // Don't add dietary tags here - they're already shown as badges in the dish card

  // Add ingredient-based tags - check for primary proteins
  const meatIndicators = getAllMeatIndicators();
  
  // Chicken variants
  if (meatIndicators.some(meat => 
    ["chicken", "鸡", "ไก่"].includes(meat.toLowerCase()) && 
    (name.includes(meat.toLowerCase()) || ingredients.some(ing => ing.toLowerCase().includes(meat.toLowerCase())))
  )) {
    tags.push("Chicken");
  }
  // Beef variants
  else if (meatIndicators.some(meat => 
    ["beef", "牛", "เนื้อวัว"].includes(meat.toLowerCase()) && 
    (name.includes(meat.toLowerCase()) || ingredients.some(ing => ing.toLowerCase().includes(meat.toLowerCase())))
  )) {
    tags.push("Beef");
  }
  // Pork variants
  else if (meatIndicators.some(meat => 
    ["pork", "猪", "หมู"].includes(meat.toLowerCase()) && 
    (name.includes(meat.toLowerCase()) || ingredients.some(ing => ing.toLowerCase().includes(meat.toLowerCase())))
  )) {
    tags.push("Pork");
  }
  // Seafood variants
  else if (meatIndicators.some(meat => 
    ["shrimp", "fish", "crab", "虾", "鱼", "蟹", "กุ้ง", "ปลา", "ปู"].includes(meat.toLowerCase()) && 
    (name.includes(meat.toLowerCase()) || ingredients.some(ing => ing.toLowerCase().includes(meat.toLowerCase())))
  )) {
    tags.push("Seafood");
  }

  // Add cooking method tags (Chinese/Thai/English)
  const cookingMethods = [
    { keywords: ["fried", "炒", "炸", "ทอด", "ผัด"], tag: "Fried" },
    { keywords: ["steamed", "蒸", "นึ่ง"], tag: "Steamed" },
    { keywords: ["grilled", "烤", "烧", "ย่าง"], tag: "Grilled" },
    { keywords: ["braised", "红烧", "焖", "ตุ๋น"], tag: "Braised" },
    { keywords: ["soup", "汤", "羹", "ซุป"], tag: "Soup" },
    { keywords: ["salad", "凉拌", "ยำ"], tag: "Salad" }
  ];

  cookingMethods.forEach(method => {
    if (method.keywords.some(keyword => name.includes(keyword))) {
      tags.push(method.tag);
    }
  });

  return tags;
}

function estimateCalories(
  ingredients: string[],
  isVegetarian: boolean
): number {
  let baseCalories = 300;

  // Adjust based on ingredients
  if (ingredients.includes("chicken")) baseCalories += 150;
  if (ingredients.includes("beef")) baseCalories += 200;
  if (ingredients.includes("pork")) baseCalories += 180;
  if (ingredients.includes("shrimp")) baseCalories += 120;
  if (ingredients.includes("tofu")) baseCalories += 80;
  if (ingredients.includes("rice")) baseCalories += 100;
  if (ingredients.includes("noodles")) baseCalories += 150;

  // Vegetarian dishes tend to be lower calorie
  if (isVegetarian) {
    baseCalories = Math.floor(baseCalories * 0.8);
  }

  return baseCalories;
}

function estimateProtein(ingredients: string[], isVegetarian: boolean): string {
  let protein = 15;

  // Adjust based on ingredients
  if (ingredients.includes("chicken")) protein += 25;
  if (ingredients.includes("beef")) protein += 30;
  if (ingredients.includes("pork")) protein += 25;
  if (ingredients.includes("shrimp")) protein += 20;
  if (ingredients.includes("tofu")) protein += 15;
  if (ingredients.includes("egg")) protein += 12;

  return `${protein}g`;
}

function estimateCookingTime(ingredients: string[], cuisine: string): string {
  let baseTime = 15;

  // Adjust based on ingredients
  if (ingredients.includes("beef")) baseTime += 10;
  if (ingredients.includes("pork")) baseTime += 5;
  if (ingredients.includes("rice")) baseTime += 5;
  if (ingredients.includes("noodles")) baseTime -= 5;

  return `${baseTime} min`;
}
