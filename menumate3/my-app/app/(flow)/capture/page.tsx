"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { analyzeImageQuality, preprocessImage } from "@/utils/imagePreprocessor";
import { FlowStorage } from "@/utils/flowStorage";
import { LoadingTransition } from "@/components/LoadingTransition";
import { AnimatePresence } from "framer-motion";

// Client-side image compression (only works in browser)
function compressImage(
  file: File,
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<File> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      reject(new Error("Compression only available in browser"));
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new window.Image();

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () =>
      reject(new Error("Failed to load image for compression"));
    img.src = URL.createObjectURL(file);
  });
}

export default function CapturePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    // Preload data and reduce loading time
    FlowStorage.preloadData();
    setIsLoading(false);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCameraError("Please select a valid image file.");
      return;
    }

    setIsProcessingImage(true);
    setCameraError(null);

    let finalFile = file;
    if (file.size > 8 * 1024 * 1024) {
      setCameraError("Compressing large image...");
      try {
        finalFile = await compressImage(file, 0.8, 1920, 1080);
        setCameraError(null);
      } catch (error) {
        console.error("Compression failed:", error);
        if (file.size > 15 * 1024 * 1024) {
          setCameraError("Image too large. Please select a smaller image.");
          setIsProcessingImage(false);
          return;
        }
        finalFile = file;
      }
    }

    try {
      const quality = await analyzeImageQuality(finalFile);
      let processedFile = finalFile;

      if (quality.needsPreprocessing) {
        processedFile = await preprocessImage(finalFile, {
          contrast: quality.isLowContrast ? 1.3 : 1.1,
          brightness: quality.isDark ? 1.2 : 1.0,
          sharpen: quality.isBlurry,
          denoise: true,
          autoRotate: true,
        });
      }

      // Optimized storage and navigation
      const reader = new FileReader();
      reader.onload = () => {
        FlowStorage.setMenuImage(reader.result as string);
        // Small delay to ensure storage is complete
        setTimeout(() => {
          router.push("/processing");
        }, 50);
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error("Image preprocessing failed:", error);
      const reader = new FileReader();
      reader.onload = () => {
        FlowStorage.setMenuImage(reader.result as string);
        setTimeout(() => {
          router.push("/processing");
        }, 50);
      };
      reader.readAsDataURL(finalFile);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isDesktop = () => {
    if (typeof window === 'undefined') return false;
    
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isWideScreen = window.innerWidth > 1024;
    const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return isWideScreen && !isMobileUA && (!hasTouch || window.innerWidth > 1200);
  };

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        setCameraError("Starting camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: isDesktop() ? 'user' : 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        
        setCameraStream(stream);
        setShowCamera(true);
        setCameraError(null);
        
        setTimeout(() => {
          if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              if (videoRef.current) {
                videoRef.current.play().catch(e => {
                  console.log('Video play failed:', e);
                });
              }
            };
          }
        }, 100);
      } catch (error) {
        console.log('Camera access denied:', error);
        setCameraError("Camera access denied. Using file picker fallback...");
        setTimeout(() => {
          setCameraError(null);
          if (isDesktop()) {
            triggerFileInput();
          } else {
            triggerMobileFileInput();
          }
        }, 2000);
      }
    } else {
      setCameraError("Camera not supported. Using file picker...");
      setTimeout(() => {
        setCameraError(null);
        if (isDesktop()) {
          triggerFileInput();
        } else {
          triggerMobileFileInput();
        }
      }, 2000);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setCameraError("Video not ready. Please wait a moment and try again.");
        setTimeout(() => setCameraError(null), 3000);
        return;
      }
      
      const context = canvas.getContext('2d');
      
      if (!context) {
        setCameraError("Canvas not supported. Please try upload instead.");
        setTimeout(() => setCameraError(null), 3000);
        return;
      }
      
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
              stopCamera();
              
              const event = {
                target: { files: [file] }
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              
              await handleFileChange(event);
            } catch (error) {
              console.error('File creation failed:', error);
              setCameraError("Failed to create image file. Please try again.");
              setTimeout(() => setCameraError(null), 3000);
            }
          } else {
            setCameraError("Failed to capture image. Please try again.");
            setTimeout(() => setCameraError(null), 3000);
          }
        }, 'image/jpeg', 0.9);
      } catch (error) {
        console.error('Canvas capture failed:', error);
        setCameraError("Failed to capture image. Please try upload instead.");
        setTimeout(() => setCameraError(null), 3000);
      }
    } else {
      setCameraError("Camera not ready. Please try again.");
      setTimeout(() => setCameraError(null), 3000);
    }
  };

  const triggerMobileFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.style.display = 'none';
    
    let cleanedUp = false;
    
    const cleanup = () => {
      if (!cleanedUp && document.body.contains(input)) {
        document.body.removeChild(input);
        cleanedUp = true;
      }
    };
    
    input.onchange = (e) => {
      const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(event);
      cleanup();
    };
    
    setTimeout(cleanup, 60000);
    
    try {
      document.body.appendChild(input);
      input.click();
    } catch (error) {
      console.error('File input failed:', error);
      cleanup();
      triggerFileInput();
    }
  };

  const handleTakePhoto = () => {
    if (isDesktop()) {
      startCamera();
    } else {
      triggerMobileFileInput();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <LoadingTransition 
            key="loading-camera"
            isLoading={isLoading} 
            message="Loading camera..." 
          />
        )}
        {isProcessingImage && (
          <LoadingTransition 
            key="processing-image"
            isLoading={isProcessingImage} 
            message="Processing image..." 
          />
        )}
      </AnimatePresence>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
        {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/welcome")}
            className="text-white hover:bg-white/20 rounded-full"
          >
            ← Back
          </Button>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium">Ready to Capture</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen p-6 pt-24 pb-32">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center mb-4">
            <Camera className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">
            Capture Your Menu
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-md">
            Take a photo or upload an image of any menu to get instant translations and dish insights
          </p>
        </div>

        {/* Camera Preview or Action Buttons */}
        {showCamera ? (
          <div className="w-full max-w-md">
            {/* Live Camera Preview */}
            <div className="relative mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-80 object-cover rounded-2xl bg-black"
              />
              {/* Viewfinder overlay */}
              <div className="absolute inset-4 border-2 border-white/50 rounded-xl pointer-events-none">
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white"></div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            {/* Camera Controls */}
            <div className="flex items-center justify-center gap-6">
              <Button
                onClick={stopCamera}
                variant="ghost"
                size="sm"
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg text-white hover:bg-white/30"
              >
                ✕
              </Button>
              
              <Button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-xl"
              >
                <div className="w-12 h-12 rounded-full border-4 border-white"></div>
              </Button>
              
              <Button
                onClick={triggerFileInput}
                variant="ghost"
                size="sm"
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg text-white hover:bg-white/30"
              >
                <Upload className="w-5 h-5" />
              </Button>
            </div>
            
            <p className="text-white/60 text-sm text-center mt-4">
              Position your menu in the frame and tap the capture button
            </p>
          </div>
        ) : (
          <div className="space-y-4 w-full max-w-sm">
            {/* Primary Action - Take Photo */}
            <Button
              onClick={handleTakePhoto}
              className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-lg font-semibold shadow-xl flex items-center justify-center gap-3"
            >
              <Camera className="w-6 h-6" />
              Take Photo
            </Button>

            {/* Secondary Action - Upload from Gallery */}
            <Button
              onClick={triggerFileInput}
              variant="outline"
              className="w-full h-14 border-2 border-white/30 text-white hover:bg-white/10 rounded-2xl text-lg font-medium flex items-center justify-center gap-3"
            >
              <Upload className="w-5 h-5" />
              Upload from Gallery
            </Button>
          </div>
        )}

        {/* Error Display */}
        {cameraError && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-center max-w-sm">
            {cameraError}
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm mb-2">
            💡 <strong>How it works:</strong>
          </p>
          <ul className="text-white/50 text-xs space-y-1 max-w-sm">
            <li>• <strong>Take Photo:</strong> Live camera on desktop, camera app on mobile</li>
            <li>• <strong>Upload from Gallery:</strong> Browse existing photos</li>
            <li>• Best results: Good lighting, steady hands, clear text</li>
            <li>• Include the full menu section you want translated</li>
          </ul>
        </div>
      </div>

      {/* Hidden file input for gallery upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      </div>
    </>
  );
}