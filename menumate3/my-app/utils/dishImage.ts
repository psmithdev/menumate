import type { ParsedDish } from "../types/menu";

export function getDishImage(dish: ParsedDish): string {
  const name = dish.originalName.toLowerCase();
  const tags = (dish.tags || []).map((t) => t.toLowerCase());

  if (tags.includes("chicken") || name.includes("chicken"))
    return "/chicken.jpg";
  if (tags.includes("tofu") || name.includes("tofu")) return "/tofu.jpg";
  if (tags.includes("pork") || name.includes("pork")) return "/pork.jpg";
  if (tags.includes("spicy") || name.includes("spicy")) return "/spicy.jpg";
  if (tags.includes("vegetarian") || name.includes("vegetarian"))
    return "/vegetarian.jpg";

  return "/default.jpg";
}
