import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DishCard } from '../components/dish-card';
import { CartProvider, useCart } from '../components/CartContext';
import type { ParsedDish } from '../types/menu';

// Mock the dishImage utilities
jest.mock('../utils/dishImage', () => ({
  getDishImage: jest.fn((dish) => `https://picsum.photos/400/300?${dish.originalName}`),
  getLocalFallbackImage: jest.fn((dish) => `/fallback-${dish.originalName.toLowerCase().replace(/\s+/g, '-')}.jpg`),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onError, onLoad, className, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        onError={onError}
        onLoad={onLoad}
        className={className}
        data-testid="dish-image"
        {...props}
      />
    );
  };
});

// Test wrapper with CartProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('DishCard', () => {
  const mockDish: ParsedDish & {
    image?: string;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    prepTime?: string;
    price?: string;
  } = {
    id: 'test-1',
    originalName: 'Pad Thai',
    translatedName: 'Thai Stir-Fried Noodles',
    originalPrice: '฿120',
    translatedPrice: '$8.50',
    tags: ['popular', 'spicy'],
    description: 'Traditional stir-fried noodles with shrimp and vegetables',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: 2,
    ingredients: ['noodles', 'shrimp', 'vegetables'],
    rating: 4.5
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders dish card with basic information', () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      expect(screen.getByText('Thai Stir-Fried Noodles')).toBeInTheDocument();
      expect(screen.getByText('Pad Thai')).toBeInTheDocument();
      expect(screen.getByText('$8.50')).toBeInTheDocument();
      expect(screen.getByText('Traditional stir-fried noodles with shrimp and vegetables')).toBeInTheDocument();
    });

    it('renders only translated name when it equals original name', () => {
      const dishSameName = { ...mockDish, translatedName: 'Pad Thai', originalName: 'Pad Thai' };
      render(
        <TestWrapper>
          <DishCard dish={dishSameName} />
        </TestWrapper>
      );

      const padThaiTexts = screen.getAllByText('Pad Thai');
      expect(padThaiTexts).toHaveLength(1);
    });

    it('renders without description when description is empty', () => {
      const dishNoDesc = { ...mockDish, description: '' };
      render(
        <TestWrapper>
          <DishCard dish={dishNoDesc} />
        </TestWrapper>
      );

      expect(screen.queryByText('Traditional stir-fried noodles with shrimp and vegetables')).not.toBeInTheDocument();
    });

    it('shows first tag when tags exist', () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      expect(screen.getByText('popular')).toBeInTheDocument();
      expect(screen.queryByText('spicy')).not.toBeInTheDocument();
    });
  });

  describe('Dietary Information', () => {
    it('shows vegan badge when dish is vegan', () => {
      const veganDish = { ...mockDish, isVegan: true };
      render(
        <TestWrapper>
          <DishCard dish={veganDish} />
        </TestWrapper>
      );

      expect(screen.getByText('🌱')).toBeInTheDocument();
    });

    it('shows vegetarian badge when dish is vegetarian but not vegan', () => {
      const vegDish = { ...mockDish, isVegetarian: true, isVegan: false };
      render(
        <TestWrapper>
          <DishCard dish={vegDish} />
        </TestWrapper>
      );

      expect(screen.getByText('🥗')).toBeInTheDocument();
      expect(screen.queryByText('🌱')).not.toBeInTheDocument();
    });

    it('shows gluten-free badge when applicable', () => {
      const gfDish = { ...mockDish, isGlutenFree: true };
      render(
        <TestWrapper>
          <DishCard dish={gfDish} />
        </TestWrapper>
      );

      expect(screen.getByText('🌾')).toBeInTheDocument();
    });

    it('shows maximum of 2 dietary badges', () => {
      const multiDietDish = { ...mockDish, isVegan: true, isGlutenFree: true };
      render(
        <TestWrapper>
          <DishCard dish={multiDietDish} />
        </TestWrapper>
      );

      expect(screen.getByText('🌱')).toBeInTheDocument();
      expect(screen.getByText('🌾')).toBeInTheDocument();
    });
  });

  describe('Spice Level', () => {
    it('shows spice level indicators when spiceLevel > 0', () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      const spiceIndicator = screen.getByText('🌶️🌶️');
      expect(spiceIndicator).toBeInTheDocument();
    });

    it('does not show spice indicators when spiceLevel is 0', () => {
      const mildDish = { ...mockDish, spiceLevel: 0 };
      render(
        <TestWrapper>
          <DishCard dish={mildDish} />
        </TestWrapper>
      );

      expect(screen.queryByText(/🌶️/)).not.toBeInTheDocument();
    });

    it('caps spice level at 3 chili peppers', () => {
      const verySpicyDish = { ...mockDish, spiceLevel: 5 };
      render(
        <TestWrapper>
          <DishCard dish={verySpicyDish} />
        </TestWrapper>
      );

      expect(screen.getByText('🌶️🌶️🌶️')).toBeInTheDocument();
    });
  });

  describe('Rating', () => {
    it('shows rating when available', () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('does not show rating when undefined', () => {
      const dishNoRating = { ...mockDish, rating: undefined };
      render(
        <TestWrapper>
          <DishCard dish={dishNoRating} />
        </TestWrapper>
      );

      expect(screen.queryByText('4.5')).not.toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    it('shows translated price when available', () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      expect(screen.getByText('$8.50')).toBeInTheDocument();
    });

    it('falls back to original price when translated price unavailable', () => {
      const dishOrigPrice = { ...mockDish, translatedPrice: undefined };
      render(
        <TestWrapper>
          <DishCard dish={dishOrigPrice} />
        </TestWrapper>
      );

      expect(screen.getByText('฿120')).toBeInTheDocument();
    });

    it('shows compatibility price when provided', () => {
      const dishWithCompatPrice = { ...mockDish, price: '$10.00' };
      render(
        <TestWrapper>
          <DishCard dish={dishWithCompatPrice} />
        </TestWrapper>
      );

      expect(screen.getByText('$8.50')).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('renders image with correct attributes', () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      const image = screen.getByTestId('dish-image');
      expect(image).toHaveAttribute('alt', 'Thai Stir-Fried Noodles');
      expect(image).toHaveAttribute('width', '400');
      expect(image).toHaveAttribute('height', '96');
    });

    it('shows loading state initially', () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      const loadingElement = document.querySelector('.animate-spin');
      expect(loadingElement).toBeInTheDocument();
    });

    it('hides loading state after image loads', async () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      const image = screen.getByTestId('dish-image');
      fireEvent.load(image);

      await waitFor(() => {
        const loadingElement = document.querySelector('.animate-spin');
        expect(loadingElement).not.toBeInTheDocument();
      });
    });

    it('handles image error by switching to fallback', async () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      const image = screen.getByTestId('dish-image');
      const initialSrc = image.getAttribute('src');
      
      fireEvent.error(image);

      await waitFor(() => {
        const newSrc = image.getAttribute('src');
        expect(newSrc).not.toBe(initialSrc);
        expect(newSrc).toContain('fallback');
      });
    });

    it('falls back to final placeholder after multiple errors', async () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      const image = screen.getByTestId('dish-image');
      
      // First error
      fireEvent.error(image);
      await waitFor(() => {
        expect(image.getAttribute('src')).toContain('fallback');
      });

      // Second error
      fireEvent.error(image);
      await waitFor(() => {
        expect(image.getAttribute('src')).toBe('/placeholder.svg');
      });
    });
  });

  describe('User Interactions', () => {
    it('calls onClick when card is clicked', () => {
      const mockOnClick = jest.fn();
      render(
        <TestWrapper>
          <DishCard dish={mockDish} onClick={mockOnClick} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: /add/i }).closest('.cursor-pointer')!);
      expect(mockOnClick).toHaveBeenCalled();
    });

    it('adds dish to cart when Add button is clicked', () => {
      const TestComponent = () => {
        const { cart } = useCart();
        return (
          <div>
            <DishCard dish={mockDish} />
            <div data-testid="cart-count">{cart.length}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
      
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    });

    it('prevents card click when Add button is clicked', () => {
      const mockOnClick = jest.fn();
      render(
        <TestWrapper>
          <DishCard dish={mockDish} onClick={mockOnClick} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Hover States', () => {
    it('applies hover styles to the card', () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      const card = document.querySelector('.cursor-pointer');
      expect(card).toHaveClass('hover:shadow-md', 'transition-all', 'duration-200');
    });

    it('applies hover styles to Add button', () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /add/i });
      expect(button).toHaveClass('hover:bg-orange-600');
    });
  });

  describe('Accessibility', () => {
    it('has proper alt text for images', () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      const image = screen.getByTestId('dish-image');
      expect(image).toHaveAttribute('alt', 'Thai Stir-Fried Noodles');
    });

    it('uses original name as alt text when no translation', () => {
      const dishNoTranslation = { ...mockDish, translatedName: undefined };
      render(
        <TestWrapper>
          <DishCard dish={dishNoTranslation} />
        </TestWrapper>
      );

      const image = screen.getByTestId('dish-image');
      expect(image).toHaveAttribute('alt', 'Pad Thai');
    });

    it('has accessible button text', () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles dish with no tags gracefully', () => {
      const dishNoTags = { ...mockDish, tags: [] };
      render(
        <TestWrapper>
          <DishCard dish={dishNoTags} />
        </TestWrapper>
      );

      expect(screen.queryByText('popular')).not.toBeInTheDocument();
    });

    it('handles very long dish names with truncation', () => {
      const longNameDish = {
        ...mockDish,
        translatedName: 'This is a very long dish name that should be truncated when displayed in the card'
      };
      render(
        <TestWrapper>
          <DishCard dish={longNameDish} />
        </TestWrapper>
      );

      const titleElement = screen.getByText(/This is a very long dish name/);
      expect(titleElement).toHaveClass('truncate');
    });

    it('handles empty or whitespace-only descriptions', () => {
      const emptyDescDish = { ...mockDish, description: '   ' };
      render(
        <TestWrapper>
          <DishCard dish={emptyDescDish} />
        </TestWrapper>
      );

      expect(screen.queryByText('Traditional stir-fried noodles')).not.toBeInTheDocument();
    });

    it('renders without optional onClick handler', () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      const card = document.querySelector('.cursor-pointer');
      expect(card).toBeInTheDocument();
      fireEvent.click(card!);
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct CSS classes for layout', () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      const card = document.querySelector('.overflow-hidden');
      expect(card).toHaveClass('cursor-pointer', 'transition-all', 'duration-200', 'border-0', 'shadow-sm');
    });

    it('applies correct image styling', () => {
      render(
        <TestWrapper>
          <DishCard dish={mockDish} />
        </TestWrapper>
      );

      const image = screen.getByTestId('dish-image');
      expect(image).toHaveClass('w-full', 'h-24', 'object-cover', 'transition-opacity', 'duration-300');
    });
  });
});