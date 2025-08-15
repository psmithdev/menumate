"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Plus, Minus } from "lucide-react";
import { useCart } from "@/components/CartContext";
import type { ParsedDish } from "@/types/menu";

interface DishActionButtonsProps {
  dish: ParsedDish;
  onShare?: () => void;
  className?: string;
}

export function DishActionButtons({ dish, onShare, className = "" }: DishActionButtonsProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, cart } = useCart();

  // Check if dish is already in cart and get current quantity
  const cartItem = cart.find(item => item.id === dish.id);
  const cartQuantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(dish);
    }
    // Reset quantity after adding
    setQuantity(1);
  };

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    // Default share functionality
    const shareData = {
      title: `${dish.translatedName || dish.originalName}`,
      text: `Check out this dish: ${dish.translatedName || dish.originalName} - ${dish.translatedPrice || dish.originalPrice}`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `${shareData.title} - ${shareData.text} ${shareData.url}`
        );
        // You could show a toast notification here
        console.log('Dish details copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    // Here you could persist favorites to localStorage or a backend
    // localStorage.setItem('favorites', JSON.stringify([...favorites, dish.id]));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quantity Selector */}
      <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-xl">
        <span className="text-sm font-medium text-gray-700">Quantity:</span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="h-8 w-8 p-0 rounded-full"
            disabled={quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold min-w-[2rem] text-center">
            {quantity}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuantity(Math.min(10, quantity + 1))}
            className="h-8 w-8 p-0 rounded-full"
            disabled={quantity >= 10}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Current cart quantity indicator */}
      {cartQuantity > 0 && (
        <div className="text-center text-sm text-green-600 bg-green-50 rounded-lg p-2">
          ✅ {cartQuantity} already in cart
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {/* Add to Cart - Primary Action */}
        <Button 
          onClick={handleAddToCart}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white h-12 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          Add {quantity > 1 ? `${quantity} ` : ''}to Order
        </Button>

        {/* Secondary Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleFavorite}
          className={`h-12 w-12 rounded-xl transition-all duration-200 ${
            isFavorited 
              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
              : 'hover:bg-gray-50'
          }`}
        >
          <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="h-12 w-12 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200"
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Additional Options */}
      <div className="flex gap-2 justify-center">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          🍽️ Customize Order
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          📝 Add Notes
        </Button>
      </div>
    </div>
  );
}