"use client";

import { Button } from "@/components/ui/button";
import { Camera, Globe, Sparkles, ChefHat } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-pink-400 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-yellow-300 rounded-full blur-lg"></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 bg-white rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-white">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mb-4">
            <ChefHat className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Hero Text */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Discover Every
            <br />
            <span className="text-yellow-200">Delicious Detail</span>
          </h1>
          <p className="text-lg opacity-90 leading-relaxed max-w-sm">
            Snap any menu and instantly understand every dish with smart
            translations and personalized recommendations
          </p>
        </div>

        {/* Features Preview */}
        <div className="flex gap-6 mb-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-2">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-sm opacity-80">Instant Scan</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-2">
              <Globe className="w-6 h-6" />
            </div>
            <p className="text-sm opacity-80">Smart Translate</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm opacity-80">Personalized</p>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => router.push("/capture")}
          className="w-full max-w-sm h-14 bg-white text-orange-500 hover:bg-gray-50 rounded-2xl text-lg font-semibold shadow-xl"
        >
          Start Exploring
        </Button>

        {/* Bottom indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-1 h-8 bg-white/30 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}