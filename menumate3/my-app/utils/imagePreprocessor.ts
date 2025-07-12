export interface PreprocessingOptions {
  contrast?: number; // 0-2, default 1
  brightness?: number; // 0-2, default 1
  sharpen?: boolean; // default true
  denoise?: boolean; // default true
  autoRotate?: boolean; // default true
}

export async function preprocessImage(
  file: File,
  options: PreprocessingOptions = {}
): Promise<File> {
  const {
    contrast = 1.2,
    brightness = 1.1,
    sharpen = true,
    denoise = true,
    autoRotate = true,
  } = options;

  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;

      if (!ctx) {
        resolve(file);
        return;
      }

      // Apply preprocessing
      ctx.filter = buildFilter(contrast, brightness, sharpen, denoise);

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Auto-rotate if needed
      if (autoRotate) {
        autoRotateImage(canvas, ctx, img);
      }

      // Convert back to file
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(processedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        0.9
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

function buildFilter(
  contrast: number,
  brightness: number,
  sharpen: boolean,
  denoise: boolean
): string {
  const filters: string[] = [];

  // Contrast
  if (contrast !== 1) {
    filters.push(`contrast(${contrast})`);
  }

  // Brightness
  if (brightness !== 1) {
    filters.push(`brightness(${brightness})`);
  }

  // Sharpen (using CSS blur and contrast trick)
  if (sharpen) {
    filters.push("contrast(1.1)");
  }

  // Denoise (using slight blur)
  if (denoise) {
    filters.push("blur(0.5px)");
  }

  return filters.join(" ");
}

function autoRotateImage(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement
) {
  // This is a simplified auto-rotation
  // In a real implementation, you'd use EXIF data or image analysis
  // For now, we'll just ensure the image is properly oriented

  const { width, height } = canvas;

  // If image is portrait but canvas is landscape, rotate
  if (img.height > img.width && width > height) {
    canvas.width = height;
    canvas.height = width;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
  }
}

// Utility function to detect image quality
export function analyzeImageQuality(file: File): Promise<{
  isBlurry: boolean;
  isDark: boolean;
  isLowContrast: boolean;
  needsPreprocessing: boolean;
}> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      if (!ctx) {
        resolve({
          isBlurry: false,
          isDark: false,
          isLowContrast: false,
          needsPreprocessing: false,
        });
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Analyze brightness
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalBrightness += (r + g + b) / 3;
      }
      const avgBrightness = totalBrightness / (data.length / 4);
      const isDark = avgBrightness < 100;

      // Analyze contrast (simplified)
      let minBrightness = 255;
      let maxBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        minBrightness = Math.min(minBrightness, brightness);
        maxBrightness = Math.max(maxBrightness, brightness);
      }
      const contrast = maxBrightness - minBrightness;
      const isLowContrast = contrast < 100;

      // Simple blur detection (edge detection)
      let edgeCount = 0;
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4;
          const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
          const down =
            (data[(y + 1) * canvas.width * 4 + x * 4] +
              data[(y + 1) * canvas.width * 4 + x * 4 + 1] +
              data[(y + 1) * canvas.width * 4 + x * 4 + 2]) /
            3;

          if (Math.abs(current - right) > 30 || Math.abs(current - down) > 30) {
            edgeCount++;
          }
        }
      }
      const edgeDensity = edgeCount / (canvas.width * canvas.height);
      const isBlurry = edgeDensity < 0.01;

      resolve({
        isBlurry,
        isDark,
        isLowContrast,
        needsPreprocessing: isBlurry || isDark || isLowContrast,
      });
    };

    img.src = URL.createObjectURL(file);
  });
}
