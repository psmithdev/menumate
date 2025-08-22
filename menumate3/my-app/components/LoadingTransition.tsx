"use client";

import { motion } from "framer-motion";
import { ChefHat } from "lucide-react";

interface LoadingTransitionProps {
  isLoading?: boolean;
  message?: string;
}

export function LoadingTransition({ isLoading = true, message = "Loading..." }: LoadingTransitionProps) {
  if (!isLoading) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-orange-400 via-red-400 to-pink-400 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="text-center text-white">
        <motion.div
          className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto mb-4"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <ChefHat className="w-8 h-8 text-white" />
        </motion.div>
        
        <motion.p
          className="text-lg font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {message}
        </motion.p>
        
        {/* Subtle loading dots */}
        <div className="flex justify-center gap-1 mt-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-white/60 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}