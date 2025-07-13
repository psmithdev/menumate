export type ParsedDish = {
  id: string;
  originalName: string;
  translatedName?: string;
  originalPrice: string;
  translatedPrice?: string;
  description?: string;
  tags: string[];
  isVegetarian: boolean;
  spiceLevel: number;
  rating?: number;
  time?: string;
  calories?: number;
  protein?: string;
  ingredients?: string[];
};
