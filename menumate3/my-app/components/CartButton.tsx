"use client";
import { useState } from "react";
import { useCart } from "./CartContext";
import { X } from "lucide-react";

export function CartButton() {
  const { cart, getCartTotal, removeFromCart, clearCart } = useCart();
  const [open, setOpen] = useState(false);


  if (cart.length === 0) return null;

  return (
    <>
      <button
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-colors touch-manipulation"
        onClick={() => setOpen(true)}
      >
        Cart: ฿{getCartTotal().toFixed(2)}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setOpen(false)}
              aria-label="Close cart"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-4">Your Cart</h2>
            <ul className="divide-y divide-gray-200 mb-4 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <div className="font-semibold">
                      {item.translatedName || item.originalName}
                    </div>
                    <div className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600 font-bold">
                      ฿
                      {(
                        parseFloat(item.originalPrice || "0") * item.quantity
                      ).toFixed(2)}
                    </span>
                    <button
                      className="text-red-500 hover:text-red-700 ml-2"
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Remove item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between font-bold text-lg mb-4">
              <span>Total:</span>
              <span>฿{getCartTotal().toFixed(2)}</span>
            </div>
            <button
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded mb-2"
              onClick={clearCart}
            >
              Clear Cart
            </button>
            <button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
