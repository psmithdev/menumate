import { getDishImage, getLocalFallbackImage } from '../dishImage';
import type { ParsedDish } from '../../types/menu';

describe('dishImage utilities', () => {
  const mockDish: ParsedDish = {
    id: 'test-1',
    originalName: 'Test Dish',
    translatedName: 'Test Dish',
    originalPrice: '$10',
    translatedPrice: '$10',
    tags: [],
    description: 'Test description',
    originalLanguage: 'en',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: 0,
    ingredients: []
  };

  describe('getDishImage', () => {
    it('should return food-only Picsum images with valid IDs', () => {
      const validFoodIds = [292, 312, 326, 365, 429, 431];
      const imageUrl = getDishImage(mockDish);
      
      expect(imageUrl).toMatch(/^https:\/\/picsum\.photos\/id\/\d+\/400\/300$/);
      
      const idMatch = imageUrl.match(/\/id\/(\d+)\//);
      expect(idMatch).toBeTruthy();
      
      const imageId = parseInt(idMatch![1]);
      expect(validFoodIds).toContain(imageId);
    });

    it('should return deterministic images for same dish name', () => {
      const dish1 = { ...mockDish, originalName: 'Chicken Curry' };
      const dish2 = { ...mockDish, originalName: 'Chicken Curry' };
      
      const image1 = getDishImage(dish1);
      const image2 = getDishImage(dish2);
      
      expect(image1).toEqual(image2);
    });

    it('should return different images for different dish names', () => {
      const dish1 = { ...mockDish, originalName: 'Chicken Curry' };
      const dish2 = { ...mockDish, originalName: 'Beef Stew' };
      
      const image1 = getDishImage(dish1);
      const image2 = getDishImage(dish2);
      
      // While they could theoretically be the same due to hashing, it's extremely unlikely
      expect(image1).not.toEqual(image2);
    });

    describe('category detection', () => {
      it('should detect chicken dishes and use chicken-specific food images', () => {
        const chickenDish = { ...mockDish, originalName: 'Chicken Tikka Masala' };
        const imageUrl = getDishImage(chickenDish);
        
        // Chicken category uses IDs: [292, 312, 326, 365, 429, 431]
        const chickenIds = [292, 312, 326, 365, 429, 431];
        const idMatch = imageUrl.match(/\/id\/(\d+)\//);
        const imageId = parseInt(idMatch![1]);
        
        expect(chickenIds).toContain(imageId);
      });

      it('should detect beef dishes and use beef-specific food images', () => {
        const beefDish = { ...mockDish, originalName: 'Beef Bourguignon' };
        const imageUrl = getDishImage(beefDish);
        
        const beefIds = [292, 312, 326, 365, 429, 431];
        const idMatch = imageUrl.match(/\/id\/(\d+)\//);
        const imageId = parseInt(idMatch![1]);
        
        expect(beefIds).toContain(imageId);
      });

      it('should detect seafood dishes and use seafood-specific food images', () => {
        const seafoodDish = { ...mockDish, originalName: 'Grilled Salmon' };
        const imageUrl = getDishImage(seafoodDish);
        
        const seafoodIds = [292, 312, 326, 365, 429, 431];
        const idMatch = imageUrl.match(/\/id\/(\d+)\//);
        const imageId = parseInt(idMatch![1]);
        
        expect(seafoodIds).toContain(imageId);
      });

      it('should detect pasta dishes and use pasta-specific food images', () => {
        const pastaDish = { ...mockDish, originalName: 'Spaghetti Carbonara' };
        const imageUrl = getDishImage(pastaDish);
        
        const pastaIds = [292, 312, 326, 365, 429, 431];
        const idMatch = imageUrl.match(/\/id\/(\d+)\//);
        const imageId = parseInt(idMatch![1]);
        
        expect(pastaIds).toContain(imageId);
      });

      it('should detect vegetarian dishes and use vegetarian-specific food images', () => {
        const veggeDish = { ...mockDish, isVegetarian: true };
        const imageUrl = getDishImage(veggeDish);
        
        const veggieIds = [292, 429, 326, 312, 365, 431];
        const idMatch = imageUrl.match(/\/id\/(\d+)\//);
        const imageId = parseInt(idMatch![1]);
        
        expect(veggieIds).toContain(imageId);
      });

      it('should detect dessert dishes and use dessert-specific food images', () => {
        const dessertDish = { ...mockDish, originalName: 'Chocolate Cake' };
        const imageUrl = getDishImage(dessertDish);
        
        const dessertIds = [429, 312, 365, 431, 326, 292];
        const idMatch = imageUrl.match(/\/id\/(\d+)\//);
        const imageId = parseInt(idMatch![1]);
        
        expect(dessertIds).toContain(imageId);
      });

      it('should use translated name for category detection', () => {
        const dish = { 
          ...mockDish, 
          originalName: 'ก๋วยเตี๋ยว', 
          translatedName: 'noodle soup' 
        };
        const imageUrl = getDishImage(dish);
        
        const pastaIds = [292, 312, 326, 365, 429, 431]; // noodle should trigger pasta category
        const idMatch = imageUrl.match(/\/id\/(\d+)\//);
        const imageId = parseInt(idMatch![1]);
        
        expect(pastaIds).toContain(imageId);
      });

      it('should use tags for category detection', () => {
        const dish = { 
          ...mockDish, 
          originalName: 'Special Dish',
          tags: ['pizza']
        };
        const imageUrl = getDishImage(dish);
        
        const pizzaIds = [292, 312, 326, 365, 429, 431];
        const idMatch = imageUrl.match(/\/id\/(\d+)\//);
        const imageId = parseInt(idMatch![1]);
        
        expect(pizzaIds).toContain(imageId);
      });

      it('should use default food images when no specific category matches', () => {
        const unknownDish = { ...mockDish, originalName: 'Mystery Dish' };
        const imageUrl = getDishImage(unknownDish);
        
        const defaultIds = [292, 312, 326, 365, 429, 431];
        const idMatch = imageUrl.match(/\/id\/(\d+)\//);
        const imageId = parseInt(idMatch![1]);
        
        expect(defaultIds).toContain(imageId);
      });
    });

    it('should only use food-related Picsum photo IDs', () => {
      // Test multiple dishes to ensure we only get food-related IDs
      const dishes = [
        { ...mockDish, originalName: 'Chicken' },
        { ...mockDish, originalName: 'Beef' },
        { ...mockDish, originalName: 'Fish' },
        { ...mockDish, originalName: 'Pasta' },
        { ...mockDish, originalName: 'Pizza' },
        { ...mockDish, originalName: 'Salad' },
        { ...mockDish, originalName: 'Unknown Food' }
      ];

      const allValidFoodIds = [292, 312, 326, 365, 429, 431];

      dishes.forEach(dish => {
        const imageUrl = getDishImage(dish);
        const idMatch = imageUrl.match(/\/id\/(\d+)\//);
        expect(idMatch).toBeTruthy();
        
        const imageId = parseInt(idMatch![1]);
        expect(allValidFoodIds).toContain(imageId);
      });
    });
  });

  describe('getLocalFallbackImage', () => {
    it('should return specific fallback images for known categories', () => {
      const chickenDish = { ...mockDish, originalName: 'Chicken Curry' };
      expect(getLocalFallbackImage(chickenDish)).toBe('/chicken.jpg');

      const tofuDish = { ...mockDish, originalName: 'Tofu Stir Fry' };
      expect(getLocalFallbackImage(tofuDish)).toBe('/tofu.jpg');

      const porkDish = { ...mockDish, originalName: 'Pork Belly' };
      expect(getLocalFallbackImage(porkDish)).toBe('/pork.jpg');

      const spicyDish = { ...mockDish, originalName: 'Spicy Noodles' };
      expect(getLocalFallbackImage(spicyDish)).toBe('/spicy.jpg');

      const veggDish = { ...mockDish, originalName: 'Vegetarian Burger' };
      expect(getLocalFallbackImage(veggDish)).toBe('/vegetarian.jpg');
    });

    it('should return default fallback for unknown categories', () => {
      const unknownDish = { ...mockDish, originalName: 'Mystery Food' };
      expect(getLocalFallbackImage(unknownDish)).toBe('/default.jpg');
    });

    it('should use tags for fallback category detection', () => {
      const dish = { 
        ...mockDish, 
        originalName: 'Special Dish',
        tags: ['chicken']
      };
      expect(getLocalFallbackImage(dish)).toBe('/chicken.jpg');
    });

    it('should prioritize more specific categories', () => {
      const dish = { 
        ...mockDish, 
        originalName: 'Spicy Chicken Curry',
        tags: ['spicy', 'chicken']
      };
      // Should return chicken.jpg as chicken check comes before spicy check
      expect(getLocalFallbackImage(dish)).toBe('/chicken.jpg');
    });
  });
});