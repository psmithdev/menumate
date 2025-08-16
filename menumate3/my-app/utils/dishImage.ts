import type { ParsedDish } from "../types/menu";

// Hash function to create deterministic seeds from dish names
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Get external image URL with fallback chain
export function getDishImage(dish: ParsedDish): string {
  const name = dish.originalName.toLowerCase();
  const translatedName = (dish.translatedName || "").toLowerCase();
  const tags = (dish.tags || []).map((t) => t.toLowerCase());
  
  // Create a deterministic seed from dish name for consistent images
  const seed = hashCode(dish.originalName) % 1000;
  
  // Use Picsum for reliable placeholder images with food-related IDs
  // Picsum has specific photo IDs that are food-related and always available
  const foodImageIds = {
    chicken: [60, 431, 660, 675, 691, 718],
    beef: [60, 431, 675, 718, 835],
    pork: [60, 431, 675, 718],
    seafood: [60, 431, 675, 718, 835],
    pasta: [60, 431, 675, 718],
    pizza: [60, 431, 675, 718, 835],
    salad: [60, 431, 675, 718],
    soup: [60, 431, 675, 718],
    rice: [60, 431, 675, 718, 835],
    tofu: [60, 431, 675, 718],
    curry: [60, 431, 675, 718, 835],
    vegetarian: [60, 431, 675, 718],
    dessert: [60, 431, 675, 718, 835],
    thai: [60, 431, 675, 718, 835],
    default: [60, 431, 675, 718, 835, 292, 312, 326, 342, 365]
  };

  let category = 'default';
  
  if (tags.includes("chicken") || name.includes("chicken") || translatedName.includes("chicken")) {
    category = 'chicken';
  } else if (tags.includes("beef") || name.includes("beef") || translatedName.includes("beef")) {
    category = 'beef';
  } else if (tags.includes("pork") || name.includes("pork") || translatedName.includes("pork")) {
    category = 'pork';
  } else if (tags.includes("seafood") || name.includes("fish") || name.includes("shrimp") || 
      name.includes("salmon") || translatedName.includes("fish") || translatedName.includes("seafood")) {
    category = 'seafood';
  } else if (tags.includes("pasta") || name.includes("pasta") || name.includes("spaghetti") || 
      name.includes("noodle") || translatedName.includes("pasta") || translatedName.includes("noodle")) {
    category = 'pasta';
  } else if (tags.includes("pizza") || name.includes("pizza") || translatedName.includes("pizza")) {
    category = 'pizza';
  } else if (tags.includes("salad") || name.includes("salad") || translatedName.includes("salad")) {
    category = 'salad';
  } else if (tags.includes("soup") || name.includes("soup") || translatedName.includes("soup")) {
    category = 'soup';
  } else if (tags.includes("rice") || name.includes("rice") || translatedName.includes("rice")) {
    category = 'rice';
  } else if (tags.includes("tofu") || name.includes("tofu") || translatedName.includes("tofu")) {
    category = 'tofu';
  } else if (tags.includes("curry") || name.includes("curry") || translatedName.includes("curry")) {
    category = 'curry';
  } else if (tags.includes("vegetarian") || tags.includes("vegan") || dish.isVegetarian || dish.isVegan) {
    category = 'vegetarian';
  } else if (tags.includes("dessert") || name.includes("cake") || name.includes("ice") || 
      translatedName.includes("dessert") || translatedName.includes("sweet")) {
    category = 'dessert';
  } else if (name.includes("pad") || name.includes("tom") || name.includes("som") || 
      translatedName.includes("thai") || translatedName.includes("asian")) {
    category = 'thai';
  }
  
  const imageIds = foodImageIds[category as keyof typeof foodImageIds];
  const selectedId = imageIds[seed % imageIds.length];
  
  return `https://picsum.photos/id/${selectedId}/400/300`;
}

// Get local fallback image for when external service fails
export function getLocalFallbackImage(dish: ParsedDish): string {
  const name = dish.originalName.toLowerCase();
  const tags = (dish.tags || []).map((t) => t.toLowerCase());

  if (tags.includes("chicken") || name.includes("chicken"))
    return "/chicken.jpg";
  if (tags.includes("tofu") || name.includes("tofu")) 
    return "/tofu.jpg";
  if (tags.includes("pork") || name.includes("pork")) 
    return "/pork.jpg";
  if (tags.includes("spicy") || name.includes("spicy")) 
    return "/spicy.jpg";
  if (tags.includes("vegetarian") || name.includes("vegetarian"))
    return "/vegetarian.jpg";

  return "/default.jpg";
}
