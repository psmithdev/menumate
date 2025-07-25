import { analyzeDish } from '../dishParser';

describe('dishParser', () => {
  describe('Vegetarian Detection', () => {
    test('should correctly identify vegetarian dishes', () => {
      const vegetarianDishes = [
        '茄子', // eggplant
        '蛋炒饭', // egg fried rice
        '青菜豆腐汤', // vegetable tofu soup
        '素食面条', // vegetarian noodles
        'Tofu Stir Fry',
        'Vegetable Curry'
      ];

      vegetarianDishes.forEach(dish => {
        const result = analyzeDish(dish);
        expect(result.isVegetarian).toBe(true);
        console.log(`✓ ${dish} -> vegetarian: ${result.isVegetarian}`);
      });
    });

    test('should correctly identify non-vegetarian dishes', () => {
      const meatDishes = [
        '鸡肉炒饭', // chicken fried rice
        '猪肉包子', // pork buns
        '牛肉面', // beef noodles
        '虾仁炒蛋', // shrimp scrambled eggs
        '火腿三明治', // ham sandwich
        '大肠面线', // intestine noodles
        'Chicken Curry',
        'Beef Steak',
        'Pork Ribs'
      ];

      meatDishes.forEach(dish => {
        const result = analyzeDish(dish);
        expect(result.isVegetarian).toBe(false);
        console.log(`✓ ${dish} -> vegetarian: ${result.isVegetarian}`);
      });
    });

    test('should handle edge cases', () => {
      const edgeCases = [
        { dish: '5', expected: false }, // number only
        { dish: '盖浇饭', expected: false }, // generic rice dish
        { dish: '', expected: false }, // empty string
        { dish: 'Unknown Dish', expected: false }, // unknown dish
        { dish: '蛋', expected: true }, // just egg
        { dish: '菜', expected: true } // just vegetable
      ];

      edgeCases.forEach(({ dish, expected }) => {
        const result = analyzeDish(dish);
        expect(result.isVegetarian).toBe(expected);
        console.log(`✓ ${dish} -> vegetarian: ${result.isVegetarian} (expected: ${expected})`);
      });
    });
  });

  describe('Spice Level Detection', () => {
    test('should detect spice levels correctly', () => {
      const spiceTests = [
        { dish: '麻辣火锅', expected: 3 }, // spicy hotpot
        { dish: '温和咖喱', expected: 1 }, // mild curry
        { dish: '变态辣鸡翅', expected: 4 }, // super spicy wings
        { dish: '清淡汤', expected: 0 }, // mild soup
        { dish: 'Spicy Thai Curry', expected: 3 }
      ];

      spiceTests.forEach(({ dish, expected }) => {
        const result = analyzeDish(dish);
        expect(result.spiceLevel).toBe(expected);
        console.log(`✓ ${dish} -> spice: ${result.spiceLevel} (expected: ${expected})`);
      });
    });
  });

  describe('Ingredient Extraction', () => {
    test('should extract ingredients correctly', () => {
      const ingredientTests = [
        { dish: '鸡肉炒饭', expectedIncludes: ['鸡', 'chicken'] },
        { dish: '茄子炒蛋', expectedIncludes: ['茄子', '蛋'] },
        { dish: 'Beef and Broccoli', expectedIncludes: ['beef', 'broccoli'] }
      ];

      ingredientTests.forEach(({ dish, expectedIncludes }) => {
        const result = analyzeDish(dish);
        expectedIncludes.forEach(ingredient => {
          const hasIngredient = result.ingredients.some(ing => 
            ing.toLowerCase().includes(ingredient.toLowerCase())
          );
          expect(hasIngredient).toBe(true);
        });
        console.log(`✓ ${dish} -> ingredients: ${result.ingredients.join(', ')}`);
      });
    });
  });

  describe('Full Analysis', () => {
    test('should provide complete analysis for sample dishes', () => {
      const testDishes = [
        '麻婆豆腐', // mapo tofu
        '宫保鸡丁', // kung pao chicken
        '青菜炒蛋', // vegetable scrambled eggs
        '红烧肉', // braised pork
        '素食春卷' // vegetarian spring rolls
      ];

      testDishes.forEach(dish => {
        const result = analyzeDish(dish);
        console.log(`\n=== Analysis for: ${dish} ===`);
        console.log(`Vegetarian: ${result.isVegetarian}`);
        console.log(`Vegan: ${result.isVegan}`);
        console.log(`Spice Level: ${result.spiceLevel}`);
        console.log(`Ingredients: ${result.ingredients.join(', ')}`);
        console.log(`Tags: ${result.tags.join(', ')}`);
        console.log(`Calories: ${result.estimatedCalories}`);
        console.log(`Protein: ${result.estimatedProtein}`);
        
        // Basic assertions
        expect(typeof result.isVegetarian).toBe('boolean');
        expect(typeof result.spiceLevel).toBe('number');
        expect(Array.isArray(result.ingredients)).toBe(true);
        expect(Array.isArray(result.tags)).toBe(true);
      });
    });
  });
});