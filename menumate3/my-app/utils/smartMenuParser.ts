// Smart Menu Parser using GPT-4 Vision
// Replaces all regex patterns with AI-powered extraction

export interface SmartDish {
  name: string;
  price: string;
  description?: string;
  category?: string;
  spiceLevel?: number;
  isVegetarian?: boolean;
  confidence: number; // 0-1 how confident the AI is
}

export interface SmartMenuResult {
  dishes: SmartDish[];
  totalDishes: number;
  processingTime: number;
  confidence: number;
  language: string;
}

/**
 * Parse menu using GPT-4 Vision API
 * Much more accurate than regex patterns
 */
export async function parseMenuWithAI(imageFile: File): Promise<SmartMenuResult> {
  const startTime = Date.now();
  
  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    const prompt = `Look at this Thai menu image. Extract ONLY the dish names and prices you can actually see written on the menu. Do not invent or create variations.

Return exactly this JSON format:
{
  "dishes": [
    {"name": "exact dish name from menu", "price": "exact price from menu", "category": "main", "confidence": 0.95}
  ],
  "language": "th",
  "totalDishes": 5
}

Extract only what is clearly visible. Stop after finding all real menu items.`;

    // Call OpenAI API
    const response = await fetch('/api/smart-parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Image,
        prompt: prompt
      })
    });

    if (!response.ok) {
      throw new Error(`AI parsing failed: ${response.statusText}`);
    }

    const result = await response.json();
    const processingTime = Date.now() - startTime;

    return {
      ...result,
      processingTime,
      confidence: calculateOverallConfidence(result.dishes)
    };

  } catch (error) {
    console.error('Smart menu parsing failed:', error);
    throw new Error('Failed to parse menu with AI');
  }
}

/**
 * Fallback: Use multiple APIs for maximum accuracy
 */
export async function parseMenuMultiAPI(imageFile: File): Promise<SmartMenuResult> {
  const apis = [
    () => parseMenuWithAI(imageFile), // GPT-4V
    () => parseWithMindee(imageFile),  // Mindee Menu API
    () => parseWithGoogleAI(imageFile) // Google Document AI
  ];

  // Try each API, use the one with highest confidence
  for (const apiCall of apis) {
    try {
      const result = await apiCall();
      if (result.confidence > 0.8) {
        return result; // High confidence, use this result
      }
    } catch (error) {
      console.warn('API failed, trying next:', error);
      continue;
    }
  }

  throw new Error('All menu parsing APIs failed');
}

// Helper functions
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Cap at 1000px width as recommended
      const maxWidth = 1000;
      const maxHeight = 1000;
      
      let { width, height } = img;
      
      // Calculate optimal dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Clear canvas and draw image (strips EXIF automatically)
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to optimized JPEG with 80% quality for maximum compression
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      console.log(`📷 Image optimized: ${file.size} bytes → ~${Math.round(base64.length * 0.75)} bytes`);
      resolve(base64);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

function calculateOverallConfidence(dishes: SmartDish[]): number {
  if (dishes.length === 0) return 0;
  const avgConfidence = dishes.reduce((sum, dish) => sum + dish.confidence, 0) / dishes.length;
  return Math.round(avgConfidence * 100) / 100;
}

async function parseWithMindee(imageFile: File): Promise<SmartMenuResult> {
  // Mindee Menu API implementation
  // https://developers.mindee.com/docs/menu-api
  throw new Error('Not implemented - replace with actual Mindee API');
}

async function parseWithGoogleAI(imageFile: File): Promise<SmartMenuResult> {
  // Google Document AI implementation
  // https://cloud.google.com/document-ai/docs/processors-list#processor_menu
  throw new Error('Not implemented - replace with actual Google API');
}