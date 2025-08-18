import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DishGrid } from '../components/DishGrid';
import { CartProvider } from '../components/CartContext';
import type { ParsedDish } from '../hooks/useDishFilters';

// Mock the dishImage utilities
jest.mock('../utils/dishImage', () => ({
  getDishImage: jest.fn((dish) => {
    // Return food-only images based on dish category
    const foodIds = [292, 312, 326, 365, 429, 431];
    const dishName = dish.originalName.toLowerCase();
    let id = 292; // default vegetables
    
    if (dishName.includes('chicken')) id = 431; // coffee/food
    else if (dishName.includes('beef')) id = 312; // honey/food  
    else if (dishName.includes('soup')) id = 326; // soup
    else if (dishName.includes('dessert')) id = 429; // berries
    
    return `https://picsum.photos/id/${id}/400/300`;
  }),
  getLocalFallbackImage: jest.fn((dish) => {
    const dishName = dish.originalName.toLowerCase();
    if (dishName.includes('chicken')) return '/chicken.jpg';
    if (dishName.includes('vegetarian')) return '/vegetarian.jpg';
    return '/default.jpg';
  }),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        data-testid="dish-image"
        {...props}
      />
    );
  };
});

// Mock EmptyState component
jest.mock('../components/EmptyStates', () => ({
  EmptyState: () => <div data-testid="empty-state">No dishes found</div>,
}));

// We'll use the actual CartProvider from the component

describe('DishGrid - Food-Only Image Display', () => {
  const mockDishes: ParsedDish[] = [
    {
      id: 'dish-1',
      originalName: 'Chicken Curry',
      translatedName: 'Chicken Curry',
      originalPrice: '$12',
      translatedPrice: '$12',
      tags: ['chicken', 'spicy'],
      description: 'Delicious chicken curry',
      originalLanguage: 'en',
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      spiceLevel: 3,
      ingredients: ['chicken', 'curry powder']
    },
    {
      id: 'dish-2',
      originalName: 'Vegetable Soup',
      translatedName: 'Vegetable Soup',
      originalPrice: '$8',
      translatedPrice: '$8',
      tags: ['soup', 'vegetarian'],
      description: 'Fresh vegetable soup',
      originalLanguage: 'en',
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 0,
      ingredients: ['vegetables', 'broth']
    },
    {
      id: 'dish-3',
      originalName: 'Berry Dessert',
      translatedName: 'Berry Dessert',
      originalPrice: '$6',
      translatedPrice: '$6',
      tags: ['dessert', 'sweet'],
      description: 'Fresh berry dessert',
      originalLanguage: 'en',
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      spiceLevel: 0,
      ingredients: ['berries', 'cream']
    }
  ];

  const defaultProps = {
    dishes: mockDishes,
    totalDishes: mockDishes.length,
    searchQuery: '',
    onDishClick: jest.fn(),
    onFilterClick: jest.fn(),
    onClearFilters: jest.fn(),
    onRetakePhoto: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display food-only placeholder images for all dishes', () => {
    render(
      <CartProvider>
        <DishGrid {...defaultProps} />
      </CartProvider>
    );

    const dishImages = screen.getAllByTestId('dish-image');
    expect(dishImages).toHaveLength(3);

    // Verify each image uses valid food-only Picsum IDs
    const validFoodIds = [292, 312, 326, 365, 429, 431];
    
    dishImages.forEach(image => {
      const src = image.getAttribute('src');
      expect(src).toMatch(/^https:\/\/picsum\.photos\/id\/\d+\/400\/300$/);
      
      const idMatch = src?.match(/\/id\/(\d+)\//);
      expect(idMatch).toBeTruthy();
      
      const imageId = parseInt(idMatch![1]);
      expect(validFoodIds).toContain(imageId);
    });
  });

  it('should use category-specific food images for different dish types', () => {
    render(
      <CartProvider>
        <DishGrid {...defaultProps} />
      </CartProvider>
    );

    const dishImages = screen.getAllByTestId('dish-image');
    
    // Chicken curry should use ID 431 (coffee/food)
    expect(dishImages[0]).toHaveAttribute('src', 'https://picsum.photos/id/431/400/300');
    
    // Vegetable soup should use ID 326 (soup)  
    expect(dishImages[1]).toHaveAttribute('src', 'https://picsum.photos/id/326/400/300');
    
    // Berry dessert should use ID 429 (berries)
    expect(dishImages[2]).toHaveAttribute('src', 'https://picsum.photos/id/429/400/300');
  });

  it('should handle empty dish list gracefully', () => {
    render(
      <CartProvider>
        <DishGrid {...defaultProps} dishes={[]} totalDishes={0} />
      </CartProvider>
    );

    const dishImages = screen.queryAllByTestId('dish-image');
    expect(dishImages).toHaveLength(0);
  });

  it('should handle dishes with missing image data', () => {
    const dishesWithMissingData = [
      {
        ...mockDishes[0],
        originalName: '', // Empty name
        tags: [] // Empty tags
      }
    ];

    render(
      <CartProvider>
        <DishGrid {...defaultProps} dishes={dishesWithMissingData} />
      </CartProvider>
    );

    const dishImage = screen.getByTestId('dish-image');
    
    // Should still get a valid food image (default category)
    expect(dishImage).toHaveAttribute('src', 'https://picsum.photos/id/292/400/300');
  });

  it('should maintain consistent images for dishes with same names', () => {
    const duplicateDishes = [
      mockDishes[0],
      { ...mockDishes[0], id: 'dish-1-duplicate' }
    ];

    render(
      <CartProvider>
        <DishGrid {...defaultProps} dishes={duplicateDishes} />
      </CartProvider>
    );

    const dishImages = screen.getAllByTestId('dish-image');
    expect(dishImages).toHaveLength(2);
    
    // Both should have the same src since they have the same name
    expect(dishImages[0].getAttribute('src')).toEqual(dishImages[1].getAttribute('src'));
  });

  it('should display proper alt text for accessibility', () => {
    render(
      <CartProvider>
        <DishGrid {...defaultProps} />
      </CartProvider>
    );

    const dishImages = screen.getAllByTestId('dish-image');
    
    expect(dishImages[0]).toHaveAttribute('alt', 'Chicken Curry');
    expect(dishImages[1]).toHaveAttribute('alt', 'Vegetable Soup');
    expect(dishImages[2]).toHaveAttribute('alt', 'Berry Dessert');
  });

  it('should use translated names for alt text when available', () => {
    const dishWithTranslation = [{
      ...mockDishes[0],
      originalName: 'ไก่แกง',
      translatedName: 'Chicken Curry'
    }];

    render(
      <CartProvider>
        <DishGrid {...defaultProps} dishes={dishWithTranslation} />
      </CartProvider>
    );

    const dishImage = screen.getByTestId('dish-image');
    expect(dishImage).toHaveAttribute('alt', 'Chicken Curry');
  });

  it('should not use non-food related image IDs', () => {
    // Test with various dish types to ensure we never get non-food IDs
    const diverseDishes = [
      { ...mockDishes[0], originalName: 'Random Dish A' },
      { ...mockDishes[0], originalName: 'Random Dish B' },
      { ...mockDishes[0], originalName: 'Random Dish C' },
      { ...mockDishes[0], originalName: 'Random Dish D' },
      { ...mockDishes[0], originalName: 'Random Dish E' }
    ];

    render(
      <CartProvider>
        <DishGrid {...defaultProps} dishes={diverseDishes} />
      </CartProvider>
    );

    const dishImages = screen.getAllByTestId('dish-image');
    const validFoodIds = [292, 312, 326, 365, 429, 431];
    
    dishImages.forEach(image => {
      const src = image.getAttribute('src');
      const idMatch = src?.match(/\/id\/(\d+)\//);
      const imageId = parseInt(idMatch![1]);
      
      // Verify this is a valid food-related ID
      expect(validFoodIds).toContain(imageId);
      
      // Verify this is NOT a common non-food ID
      const nonFoodIds = [1, 2, 3, 100, 200, 500, 1000];
      expect(nonFoodIds).not.toContain(imageId);
    });
  });

  it('should handle dietary preferences in image selection', () => {
    const vegetarianDish = [{
      ...mockDishes[0],
      originalName: 'Vegetarian Burger',
      isVegetarian: true,
      tags: ['vegetarian']
    }];

    render(
      <CartProvider>
        <DishGrid {...defaultProps} dishes={vegetarianDish} />
      </CartProvider>
    );

    const dishImage = screen.getByTestId('dish-image');
    const src = dishImage.getAttribute('src');
    
    // Should still use valid food ID
    const validFoodIds = [292, 312, 326, 365, 429, 431];
    const idMatch = src?.match(/\/id\/(\d+)\//);
    const imageId = parseInt(idMatch![1]);
    expect(validFoodIds).toContain(imageId);
  });
});