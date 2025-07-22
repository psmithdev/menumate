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

// Common ingredients by cuisine
const CHINESE_INGREDIENTS = [
  "chicken",
  "pork",
  "beef",
  "shrimp",
  "tofu",
  "egg",
  "rice",
  "noodles",
  "soy sauce",
  "ginger",
  "garlic",
  "scallions",
  "bell peppers",
  "mushrooms",
  "bamboo shoots",
  "water chestnuts",
  "bok choy",
  "snow peas",
];

const THAI_INGREDIENTS = [
  "chicken",
  "pork",
  "beef",
  "shrimp",
  "fish",
  "tofu",
  "rice",
  "noodles",
  "coconut milk",
  "lemongrass",
  "lime",
  "fish sauce",
  "basil",
  "mint",
  "peanuts",
  "bean sprouts",
  "bamboo shoots",
  "galangal",
];

// Spice indicators - Enhanced with more comprehensive patterns
const SPICE_INDICATORS = {
  mild: ["mild", "sweet", "sour", "light", "gentle", "no spice", "non-spicy", "子供", "子ども"],
  medium: ["medium", "moderate", "balanced", "traditional", "少し辛い", "微辣", "小辣"],
  hot: ["spicy", "hot", "fiery", "burning", "chili", "pepper", "curry", "szechuan", "sichuan", "辛い", "中辣", "jalapeño", "habanero", "thai chili", "bird's eye", "sambal", "gochujang"],
  very_hot: ["extra spicy", "very hot", "burning hot", "nuclear", "volcano", "ghost pepper", "carolina reaper", "scotch bonnet", "超辛い", "大辣", "火辣", "麻辣"],
};

// Vegetarian indicators - Enhanced
const VEGETARIAN_INDICATORS = [
  "vegetarian", "vegan", "tofu", "tempeh", "seitan", "mushroom", "vegetable", "veggie", 
  "plant-based", "meatless", "素", "素食", "菜", "豆腐", "蔬菜", "菇", "eggplant", "aubergine",
  "spinach", "broccoli", "cabbage", "bean", "lentil", "quinoa", "avocado"
];

// Dairy ingredients for dairy-free detection
const DAIRY_INGREDIENTS = [
  "milk", "cheese", "butter", "cream", "yogurt", "dairy", "lactose", "whey", "casein",
  "mozzarella", "parmesan", "cheddar", "cottage cheese", "sour cream", "ice cream",
  "ghee", "buttermilk", "半脂", "全脂", "チーズ", "バター", "クリーム", "ヨーグルト"
];

// Nut ingredients for nut allergy detection
const NUT_INGREDIENTS = [
  "almond", "walnut", "cashew", "peanut", "pecan", "pistachio", "hazelnut", "macadamia",
  "pine nut", "brazil nut", "chestnut", "nut", "nuts", "アーモンド", "クルミ", "カシューナッツ",
  "ピーナッツ", "落花生", "坚果", "杏仁", "核桃", "腰果", "花生"
];

// Gluten ingredients - Enhanced
const GLUTEN_INGREDIENTS = [
  "wheat", "flour", "bread", "noodles", "dumpling", "pasta", "ramen", "udon", "soba",
  "gluten", "barley", "rye", "malt", "seitan", "tempura", "breaded", "batter",
  "小麦", "麺", "餃子", "パン", "うどん", "ラーメン", "そば", "天ぷら"
];

// Meat indicators
const MEAT_INDICATORS = [
  "chicken",
  "pork",
  "beef",
  "lamb",
  "duck",
  "fish",
  "shrimp",
  "crab",
  "meat",
  "beef",
  "steak",
  "burger",
  "sausage",
];

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

  // Get cuisine-specific ingredients
  const cuisineIngredients =
    cuisine === "thai" ? THAI_INGREDIENTS : CHINESE_INGREDIENTS;

  // Check for ingredients in dish name
  cuisineIngredients.forEach((ingredient) => {
    if (name.includes(ingredient)) {
      ingredients.push(ingredient);
    }
  });

  // Add common ingredients if none found
  if (ingredients.length === 0) {
    ingredients.push("rice", "vegetables");
  }

  return ingredients;
}

function determineSpiceLevel(dishName: string): number {
  const name = dishName.toLowerCase();

  if (SPICE_INDICATORS.very_hot.some((indicator) => name.includes(indicator))) {
    return 4;
  } else if (
    SPICE_INDICATORS.hot.some((indicator) => name.includes(indicator))
  ) {
    return 3;
  } else if (
    SPICE_INDICATORS.medium.some((indicator) => name.includes(indicator))
  ) {
    return 2;
  } else if (
    SPICE_INDICATORS.mild.some((indicator) => name.includes(indicator))
  ) {
    return 1;
  }

  return 0; // Default to mild
}

function checkVegetarian(dishName: string, ingredients: string[]): boolean {
  const name = dishName.toLowerCase();

  // Check for vegetarian indicators
  if (VEGETARIAN_INDICATORS.some((indicator) => name.includes(indicator))) {
    return true;
  }

  // Check for meat indicators
  if (MEAT_INDICATORS.some((indicator) => name.includes(indicator))) {
    return false;
  }

  // Check ingredients
  const hasMeat = ingredients.some((ingredient) =>
    MEAT_INDICATORS.includes(ingredient)
  );

  return !hasMeat;
}

function checkVegan(dishName: string, ingredients: string[]): boolean {
  const name = dishName.toLowerCase();

  // Check for vegan indicators
  if (name.includes("vegan")) {
    return true;
  }

  // Check for non-vegan ingredients
  const nonVeganIngredients = ["egg", "milk", "cheese", "butter", "cream"];
  const hasNonVegan = ingredients.some((ingredient) =>
    nonVeganIngredients.includes(ingredient)
  );

  return !hasNonVegan && checkVegetarian(dishName, ingredients);
}

function checkGlutenFree(dishName: string, ingredients: string[]): boolean {
  const name = dishName.toLowerCase();

  // Check for explicit gluten-free marking
  if (name.includes("gluten-free") || name.includes("gluten free") || name.includes("無麩質")) {
    return true;
  }

  // Check for gluten-containing ingredients in name
  const hasGlutenInName = GLUTEN_INGREDIENTS.some((ingredient) =>
    name.includes(ingredient)
  );

  // Check for gluten-containing ingredients in parsed ingredients
  const hasGlutenInIngredients = ingredients.some((ingredient) =>
    GLUTEN_INGREDIENTS.some(gluten => ingredient.toLowerCase().includes(gluten))
  );

  return !hasGlutenInName && !hasGlutenInIngredients;
}

function checkDairyFree(dishName: string, ingredients: string[]): boolean {
  const name = dishName.toLowerCase();

  // Check for explicit dairy-free marking
  if (name.includes("dairy-free") || name.includes("dairy free") || name.includes("無乳製品")) {
    return true;
  }

  // Check for dairy ingredients in name
  const hasDairyInName = DAIRY_INGREDIENTS.some((ingredient) =>
    name.includes(ingredient)
  );

  // Check for dairy ingredients in parsed ingredients
  const hasDairyInIngredients = ingredients.some((ingredient) =>
    DAIRY_INGREDIENTS.some(dairy => ingredient.toLowerCase().includes(dairy))
  );

  return !hasDairyInName && !hasDairyInIngredients;
}

function checkNutFree(dishName: string, ingredients: string[]): boolean {
  const name = dishName.toLowerCase();

  // Check for explicit nut-free marking
  if (name.includes("nut-free") || name.includes("nut free") || name.includes("無堅果")) {
    return true;
  }

  // Check for nut ingredients in name
  const hasNutInName = NUT_INGREDIENTS.some((ingredient) =>
    name.includes(ingredient)
  );

  // Check for nut ingredients in parsed ingredients
  const hasNutInIngredients = ingredients.some((ingredient) =>
    NUT_INGREDIENTS.some(nut => ingredient.toLowerCase().includes(nut))
  );

  return !hasNutInName && !hasNutInIngredients;
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

  // Add spice tags
  if (spiceLevel >= 3) {
    tags.push("Spicy");
  } else if (spiceLevel === 0) {
    tags.push("Mild");
  }

  // Add dietary tags
  if (isVegetarian) {
    tags.push("Vegetarian");
  }
  if (isVegan) {
    tags.push("Vegan");
  }
  if (isGlutenFree) {
    tags.push("Gluten-Free");
  }
  if (isDairyFree) {
    tags.push("Dairy-Free");
  }
  if (isNutFree) {
    tags.push("Nut-Free");
  }

  // Add ingredient-based tags
  if (ingredients.includes("chicken")) {
    tags.push("Chicken");
  } else if (ingredients.includes("beef")) {
    tags.push("Beef");
  } else if (ingredients.includes("pork")) {
    tags.push("Pork");
  } else if (ingredients.includes("shrimp")) {
    tags.push("Seafood");
  }

  // Add cooking method tags
  if (name.includes("fried")) {
    tags.push("Fried");
  } else if (name.includes("steamed")) {
    tags.push("Steamed");
  } else if (name.includes("grilled")) {
    tags.push("Grilled");
  }

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
