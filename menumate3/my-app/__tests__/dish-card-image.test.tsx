import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DishCard } from '../components/dish-card';
import { CartProvider } from '../components/CartContext';
import type { ParsedDish } from '../types/menu';

// Mock the dishImage utilities
jest.mock('../utils/dishImage', () => ({
  getDishImage: jest.fn((dish) => {
    // Return deterministic food-only images based on dish name
    const foodIds = [292, 312, 326, 365, 429, 431];
    const originalName = dish.originalName.toLowerCase();
    const translatedName = (dish.translatedName || '').toLowerCase();
    let id = 292; // default food ID
    
    if (originalName.includes('chicken') || translatedName.includes('chicken')) id = 431;
    else if (originalName.includes('beef') || translatedName.includes('beef')) id = 312;
    else if (originalName.includes('pasta') || translatedName.includes('pasta')) id = 326;
    else if (originalName.includes('dessert') || translatedName.includes('dessert')) id = 429;
    
    return `https://picsum.photos/id/${id}/400/300`;
  }),
  getLocalFallbackImage: jest.fn((dish) => {
    const dishName = dish.originalName.toLowerCase();
    if (dishName.includes('chicken')) return '/chicken.jpg';
    if (dishName.includes('tofu')) return '/tofu.jpg';
    if (dishName.includes('spicy')) return '/spicy.jpg';
    return '/default.jpg';
  }),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onError, onLoad, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        onError={onError}
        onLoad={onLoad}
        data-testid="dish-image"
        {...props}
      />
    );
  };
});

// We'll use the actual CartProvider from the component

describe('DishCard Image Rendering', () => {
  const mockDish: ParsedDish = {
    id: 'test-1',
    originalName: 'Test Dish',
    translatedName: 'Test Dish',
    originalPrice: '$10',
    translatedPrice: '$10',
    tags: [],
    description: 'Test description',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: 0,
    ingredients: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display external food-only placeholder image initially', () => {
    render(
      <CartProvider>
        <DishCard dish={mockDish} />
      </CartProvider>
    );

    const image = screen.getByTestId('dish-image');
    expect(image).toHaveAttribute('src', 'https://picsum.photos/id/292/400/300');
    expect(image).toHaveAttribute('alt', 'Test Dish');
  });

  it('should use category-specific food images for different dish types', () => {
    const chickenDish = { ...mockDish, originalName: 'Chicken Curry' };
    const { rerender } = render(
      <CartProvider>
        <DishCard dish={chickenDish} />
      </CartProvider>
    );

    expect(screen.getByTestId('dish-image')).toHaveAttribute(
      'src', 
      'https://picsum.photos/id/431/400/300'
    );

    const beefDish = { ...mockDish, originalName: 'Beef Stew' };
    rerender(
      <CartProvider>
        <DishCard dish={beefDish} />
      </CartProvider>
    );

    expect(screen.getByTestId('dish-image')).toHaveAttribute(
      'src', 
      'https://picsum.photos/id/312/400/300'
    );
  });

  it('should show loading state initially', () => {
    render(
      <CartProvider>
        <DishCard dish={mockDish} />
      </CartProvider>
    );

    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('should hide loading state after image loads', async () => {
    render(
      <CartProvider>
        <DishCard dish={mockDish} />
      </CartProvider>
    );

    const image = screen.getByTestId('dish-image');
    
    // Simulate image load
    fireEvent.load(image);

    await waitFor(() => {
      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).not.toBeInTheDocument();
    });
  });

  it('should fallback to local food image on external image error', async () => {
    const chickenDish = { ...mockDish, originalName: 'Chicken Tikka' };
    render(
      <CartProvider>
        <DishCard dish={chickenDish} />
      </CartProvider>
    );

    const image = screen.getByTestId('dish-image');
    
    // Initially shows external food image
    expect(image).toHaveAttribute('src', 'https://picsum.photos/id/431/400/300');
    
    // Simulate external image error
    fireEvent.error(image);

    await waitFor(() => {
      expect(image).toHaveAttribute('src', '/chicken.jpg');
    });
  });

  it('should fallback to final placeholder on local image error', async () => {
    render(
      <CartProvider>
        <DishCard dish={mockDish} />
      </CartProvider>
    );

    const image = screen.getByTestId('dish-image');
    
    // Trigger first error (external -> local)
    fireEvent.error(image);
    
    await waitFor(() => {
      expect(image).toHaveAttribute('src', '/default.jpg');
    });

    // Trigger second error (local -> final fallback)
    fireEvent.error(image);

    await waitFor(() => {
      expect(image).toHaveAttribute('src', '/placeholder.svg');
    });
  });

  it('should not fallback beyond final placeholder', async () => {
    render(
      <CartProvider>
        <DishCard dish={mockDish} />
      </CartProvider>
    );

    const image = screen.getByTestId('dish-image');
    
    // Trigger first error (external -> local)
    fireEvent.error(image);
    await waitFor(() => {
      expect(image).toHaveAttribute('src', '/default.jpg');
    });

    // Trigger second error (local -> final)
    fireEvent.error(image);
    await waitFor(() => {
      expect(image).toHaveAttribute('src', '/placeholder.svg');
    });

    // Trigger third error (should stay at final fallback)
    fireEvent.error(image);
    await waitFor(() => {
      expect(image).toHaveAttribute('src', '/placeholder.svg');
    });
  });

  it('should use food-only images from valid Picsum photo IDs', () => {
    const validFoodIds = [292, 312, 326, 365, 429, 431];
    const dishes = [
      { ...mockDish, originalName: 'Chicken' },
      { ...mockDish, originalName: 'Beef' },
      { ...mockDish, originalName: 'Pasta' },
      { ...mockDish, originalName: 'Dessert' },
      { ...mockDish, originalName: 'Default' }
    ];

    dishes.forEach((dish) => {
      const { unmount } = render(
        <CartProvider>
          <DishCard dish={dish} />
        </CartProvider>
      );

      const image = screen.getByTestId('dish-image');
      const src = image.getAttribute('src');
      const idMatch = src?.match(/\/id\/(\d+)\//);
      
      expect(idMatch).toBeTruthy();
      const imageId = parseInt(idMatch![1]);
      expect(validFoodIds).toContain(imageId);

      unmount();
    });
  });

  it('should maintain image aspect ratio and styling', () => {
    render(
      <CartProvider>
        <DishCard dish={mockDish} />
      </CartProvider>
    );

    const image = screen.getByTestId('dish-image');
    expect(image).toHaveAttribute('width', '400');
    expect(image).toHaveAttribute('height', '96');
    expect(image).toHaveClass('w-full', 'h-24', 'object-cover');
  });

  it('should handle dishes with different dietary preferences correctly', () => {
    const veganDish = { ...mockDish, isVegan: true, originalName: 'Tofu Stir Fry' };
    render(
      <CartProvider>
        <DishCard dish={veganDish} />
      </CartProvider>
    );

    // Should still get a valid food image regardless of dietary preferences
    const image = screen.getByTestId('dish-image');
    const src = image.getAttribute('src');
    expect(src).toMatch(/^https:\/\/picsum\.photos\/id\/\d+\/400\/300$/);
  });

  it('should handle translated dish names for image selection', () => {
    const dish = { 
      ...mockDish, 
      originalName: 'ไก่ผัดเม็ดมะม่วงหิมพานต์', 
      translatedName: 'Chicken Cashew Stir Fry' 
    };
    
    render(
      <CartProvider>
        <DishCard dish={dish} />
      </CartProvider>
    );

    const image = screen.getByTestId('dish-image');
    expect(image).toHaveAttribute('alt', 'Chicken Cashew Stir Fry');
    
    // Should use chicken-specific image based on translated name
    expect(image).toHaveAttribute('src', 'https://picsum.photos/id/431/400/300');
  });
});