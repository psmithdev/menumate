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
    
    const prompt = `
    You are an expert at reading restaurant menus. Carefully examine this entire menu image and systematically extract EVERY food and drink item that customers can order.

    SCAN THE ENTIRE IMAGE:
    - Look at all sections of the menu (top, bottom, left, right, center)
    - Read all text in any language (Thai, English, Chinese, etc.)
    - Don't miss items in different sections or categories
    - Include items with and without visible prices
    - Look for items in small text or side areas

    FOR EACH ITEM YOU FIND:
    - Extract the exact dish name as written (preserve original language)
    - Extract the price if visible (keep exact format like "120/220 บาท" or "60 บาท")
    - If no price visible, use "Price not shown"
    - Assign category based on the menu section or item type
    - Rate confidence 0.8-1.0 for clear items, 0.6-0.7 for partially visible

    COMPREHENSIVE EXTRACTION:
    Be thorough - extract every single item you can see, even if:
    - Text is small or partially obscured
    - Item appears in a different section
    - Price format is unusual (ranges, multiple options)
    - Mixed languages are used

    Return JSON with ALL items found:
    {
      "dishes": [
        {
          "name": "exact dish name as written",
          "price": "exact price format or 'Price not shown'",
          "category": "rice/noodles/soup/appetizer/main/dessert/drink/side",
          "confidence": 0.95
        }
      ],
      "language": "th",
      "totalDishes": total_count
    }
    `;

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
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
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