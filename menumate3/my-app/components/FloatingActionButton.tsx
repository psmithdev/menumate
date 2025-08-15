"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface FloatingActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost";
  position?: {
    bottom: number;
    right: number;
  };
  label?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function FloatingActionButton({
  icon: Icon,
  onClick,
  className = "",
  size = "md",
  variant = "primary",
  position = { bottom: 24, right: 24 },
  label,
  disabled = false,
  children,
}: FloatingActionButtonProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-14 h-14", 
    lg: "w-16 h-16"
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7"
  };

  const variantClasses = {
    primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 shadow-lg hover:shadow-xl border border-gray-200",
    ghost: "bg-white/90 hover:bg-white text-gray-700 shadow-md hover:shadow-lg backdrop-blur-sm border border-white/20"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`
        fixed z-50 rounded-full transition-all duration-200 touch-manipulation
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled ? "opacity-50 cursor-not-allowed" : "active:scale-95"}
        ${className}
      `}
      style={{
        bottom: `${position.bottom}px`,
        right: `${position.right}px`,
      }}
    >
      {children || (
        <div className="flex items-center justify-center">
          <Icon className={iconSizes[size]} />
        </div>
      )}
    </button>
  );
}