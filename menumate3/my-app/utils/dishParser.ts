export interface DishAnalysis {
  ingredients: string[];
  spiceLevel: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
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

// Spice indicators
const SPICE_INDICATORS = {
  mild: ["mild", "sweet", "sour", "light", "gentle"],
  medium: ["medium", "moderate", "balanced", "traditional"],
  hot: ["spicy", "hot", "fiery", "burning", "chili", "pepper", "curry"],
  very_hot: ["extra spicy", "very hot", "burning hot", "nuclear", "volcano"],
};

// Vegetarian indicators
const VEGETARIAN_INDICATORS = [
  "vegetarian",
  "vegan",
  "tofu",
  "tempeh",
  "seitan",
  "mushroom",
  "vegetable",
  "veggie",
  "plant-based",
  "meatless",
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
  const isGlutenFree = checkGlutenFree(name);

  // Generate tags
  const tags = generateTags(name, ingredients, spiceLevel, isVegetarian);

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

function checkGlutenFree(dishName: string): boolean {
  const name = dishName.toLowerCase();

  // Check for gluten-containing ingredients
  const glutenIngredients = ["wheat", "flour", "bread", "noodles", "dumpling"];
  const hasGluten = glutenIngredients.some((ingredient) =>
    name.includes(ingredient)
  );

  return !hasGluten;
}

function generateTags(
  dishName: string,
  ingredients: string[],
  spiceLevel: number,
  isVegetarian: boolean
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
