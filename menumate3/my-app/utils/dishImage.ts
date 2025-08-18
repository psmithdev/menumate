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
  
  // Use Picsum for reliable placeholder images with actual food-related IDs
  // These IDs have been verified to show actual food and beverage images
  const foodImageIds = {
    chicken: [292, 312, 326, 365, 429, 431], // vegetables, honey, soup, tea, berries, coffee
    beef: [292, 312, 326, 365, 429, 431],
    pork: [292, 312, 326, 365, 429, 431],
    seafood: [292, 312, 326, 365, 429, 431],
    pasta: [292, 312, 326, 365, 429, 431],
    pizza: [292, 312, 326, 365, 429, 431],
    salad: [292, 326, 365, 429, 431, 312], // prioritize vegetables for salads
    soup: [326, 312, 365, 292, 429, 431], // prioritize soup image
    rice: [292, 312, 326, 365, 429, 431],
    tofu: [292, 326, 365, 312, 429, 431], // prioritize vegetables for tofu
    curry: [326, 312, 292, 365, 429, 431], // prioritize soup-like images
    vegetarian: [292, 429, 326, 312, 365, 431], // prioritize vegetables and berries
    dessert: [429, 312, 365, 431, 326, 292], // prioritize berries and sweet items
    thai: [292, 312, 326, 365, 429, 431],
    default: [292, 312, 326, 365, 429, 431] // all verified food images
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
