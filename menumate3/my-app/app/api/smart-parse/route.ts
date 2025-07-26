// API route for GPT-4 Vision menu parsing
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json();

    if (!image || !prompt) {
      return NextResponse.json(
        { error: 'Missing image or prompt' },
        { status: 400 }
      );
    }

    // Mock response for development - replace with actual OpenAI API call
    if (process.env.USE_MOCK_AI === 'true') {
      console.log('🤖 Using mock GPT-4 Vision response for development');
      return NextResponse.json({
        dishes: [
          {
            name: "ส้มตำ",
            price: "80 บาท",
            category: "appetizer", 
            spiceLevel: 3,
            isVegetarian: true,
            confidence: 0.95
          },
          {
            name: "แกงเขียวหวานไก่",
            price: "120 บาท",
            category: "main",
            spiceLevel: 2,
            isVegetarian: false,
            confidence: 0.92
          },
          {
            name: "ข้าวผัดกุ้ง",
            price: "100 บาท", 
            category: "main",
            spiceLevel: 1,
            isVegetarian: false,
            confidence: 0.98
          },
          {
            name: "ต้มยำกุ้ง",
            price: "150 บาท",
            category: "soup",
            spiceLevel: 3,
            isVegetarian: false,
            confidence: 0.96
          },
          {
            name: "ผักบุ้งไฟแดง",
            price: "60 บาท",
            category: "vegetable",
            spiceLevel: 2,
            isVegetarian: true,
            confidence: 0.89
          },
          {
            name: "ข้าวเปล่า",
            price: "20 บาท",
            category: "rice",
            spiceLevel: 0,
            isVegetarian: true,
            confidence: 0.99
          },
          {
            name: "น้ำมะนาว",
            price: "40 บาท",
            category: "drink",
            spiceLevel: 0,
            isVegetarian: true,
            confidence: 0.97
          }
        ],
        language: "th",
        totalDishes: 7
      });
    }

    // Actual OpenAI API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: prompt 
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1 // Low temperature for consistent extraction
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse JSON response
    const parsedResult = JSON.parse(content);
    
    return NextResponse.json(parsedResult);

  } catch (error) {
    console.error('Smart parse API error:', error);
    return NextResponse.json(
      { error: 'Failed to parse menu with AI' },
      { status: 500 }
    );
  }
}