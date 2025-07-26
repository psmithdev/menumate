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
    You are an expert menu parser. Extract ALL menu items from this image.
    
    RULES:
    1. ONLY extract actual food/drink items that customers can order
    2. IGNORE: promotional text, restaurant info, categories, descriptions, instructions
    3. For each dish, extract: name, price (if visible), category (appetizer/main/dessert/drink)
    4. Detect spice level (0-4) and if vegetarian based on ingredients
    
    Return JSON in this exact format:
    {
      "dishes": [
        {
          "name": "Pad Thai",
          "price": "120 บาท", 
          "category": "main",
          "spiceLevel": 2,
          "isVegetarian": false,
          "confidence": 0.95
        }
      ],
      "language": "th",
      "totalDishes": 12
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