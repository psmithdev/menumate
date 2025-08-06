// API route for GPT-4 Vision menu parsing (BACKUP/FALLBACK ONLY)
// Primary parsing now uses Google Cloud Vision + intelligent parsing (faster, cheaper)
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log("📥 Smart parse API called");

  try {
    const parseStartTime = Date.now();
    const { image, prompt } = await req.json();
    const parseTime = Date.now() - parseStartTime;
    console.log("📋 Request data received:", {
      hasImage: !!image,
      hasPrompt: !!prompt,
      imageLength: image?.length || 0,
      parseTime: `${parseTime}ms`,
    });

    if (!image || !prompt) {
      console.error("❌ Missing required data:", {
        hasImage: !!image,
        hasPrompt: !!prompt,
      });
      return NextResponse.json(
        { error: "Missing image or prompt" },
        { status: 400 }
      );
    }

    // Mock response for development - replace with actual OpenAI API call
    if (process.env.USE_MOCK_AI === "true") {
      console.log("🤖 Using mock GPT-4 Vision response for development");
      return NextResponse.json({
        dishes: [
          {
            name: "ส้มตำ",
            price: "80 บาท",
            category: "appetizer",
            spiceLevel: 3,
            isVegetarian: true,
            confidence: 0.95,
          },
          {
            name: "แกงเขียวหวานไก่",
            price: "120 บาท",
            category: "main",
            spiceLevel: 2,
            isVegetarian: false,
            confidence: 0.92,
          },
          {
            name: "ข้าวผัดกุ้ง",
            price: "100 บาท",
            category: "main",
            spiceLevel: 1,
            isVegetarian: false,
            confidence: 0.98,
          },
          {
            name: "ต้มยำกุ้ง",
            price: "150 บาท",
            category: "soup",
            spiceLevel: 3,
            isVegetarian: false,
            confidence: 0.96,
          },
          {
            name: "ผักบุ้งไฟแดง",
            price: "60 บาท",
            category: "vegetable",
            spiceLevel: 2,
            isVegetarian: true,
            confidence: 0.89,
          },
          {
            name: "ข้าวเปล่า",
            price: "20 บาท",
            category: "rice",
            spiceLevel: 0,
            isVegetarian: true,
            confidence: 0.99,
          },
          {
            name: "น้ำมะนาว",
            price: "40 บาท",
            category: "drink",
            spiceLevel: 0,
            isVegetarian: true,
            confidence: 0.97,
          },
        ],
        language: "th",
        totalDishes: 7,
      });
    }

    // Check if OpenAI API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY not found in environment variables");
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    console.log("🚀 Calling OpenAI GPT-4 Vision API...");
    console.log("📝 Prompt being sent:", prompt.substring(0, 200) + "...");
    console.log("🖼️ Image data length:", image.length, "characters");
    console.log("📊 Performance baseline: ~17-20s expected, targeting <10s");

    // Time the OpenAI API call
    const apiStartTime = Date.now();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(45000), // 45s timeout to handle comprehensive prompts
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                  detail: "high", // Restore high detail for better accuracy
                },
              },
            ],
          },
        ],
        max_tokens: 2500, // Increased to prevent JSON truncation with complex menus
        temperature: 0, // Lowest possible for maximum speed  
        stream: false, // Keep false for now - streaming requires different handling
        top_p: 0.1, // Add top_p to reduce sampling complexity
        frequency_penalty: 0.2, // Light penalty to reduce repetition without limiting extraction
      }),
    });

    const apiTime = Date.now() - apiStartTime;
    console.log(
      "📡 OpenAI API response status:",
      response.status,
      response.statusText
    );
    console.log("⏱️ OpenAI API call took:", `${apiTime}ms`);
    
    // Performance analysis
    if (apiTime > 15000) {
      console.log("🐌 SLOW: API took >15s - check image size & network");
    } else if (apiTime > 10000) {
      console.log("⚠️ MODERATE: API took >10s - room for improvement");
    } else {
      console.log("⚡ FAST: API took <10s - good performance!");
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ OpenAI API error details:", errorData);
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const jsonStartTime = Date.now();
    const data = await response.json();
    const jsonTime = Date.now() - jsonStartTime;
    console.log(
      "✅ OpenAI response received, choices:",
      data.choices?.length || 0
    );
    console.log("⏱️ JSON parsing took:", `${jsonTime}ms`);

    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error("❌ No content in OpenAI response:", data);
      throw new Error("No content received from OpenAI");
    }

    console.log("📝 Content received, length:", content.length);
    console.log("📝 Raw content preview:", content.substring(0, 300) + "...");
    
    // Size analysis
    if (content.length > 3000) {
      console.log("📏 Large response - could be optimized");
    } else {
      console.log("📏 Compact response - good size");
    }
    
    // Log token usage if available
    if (data.usage) {
      console.log("🔢 Token usage:", {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens
      });
    }

    // Clean JSON response (remove markdown code blocks if present)
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    console.log(
      "🧹 Cleaned content preview:",
      cleanContent.substring(0, 200) + "..."
    );

    // Parse JSON response with error handling
    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanContent);
      console.log("✅ Parsed result:", {
        totalDishes: parsedResult.totalDishes,
      });

      // Convert malformed nested structure to expected flat array
      if (!parsedResult.dishes && typeof parsedResult === 'object') {
        console.log("🔧 Converting nested menu structure to flat array...");
        const dishes: any[] = [];
        
        // Extract dishes from nested structure
        for (const [categoryKey, categoryValue] of Object.entries(parsedResult)) {
          if (Array.isArray(categoryValue)) {
            console.log(`📂 Found category "${categoryKey}" with ${categoryValue.length} items`);
            categoryValue.forEach((item: any) => {
              if (item.name && item.price && item.name.trim() && item.price.trim()) {
                dishes.push({
                  name: item.name,
                  price: item.price,
                  category: categoryKey.includes('ราด') ? 'rice' : 
                           categoryKey.includes('เคียง') ? 'side' :
                           categoryKey.includes('กับข้าว') ? 'main' :
                           categoryKey.includes('ซุป') || categoryKey.includes('ต้ม') ? 'soup' : 'main',
                  confidence: 0.9
                });
              }
            });
          }
        }
        
        parsedResult = {
          dishes: dishes,
          totalDishes: dishes.length,
          language: 'th'
        };
        
        console.log(`🔄 Converted to flat structure: ${dishes.length} dishes`);
      }

      // Validate result to prevent hallucinations
      if (parsedResult.dishes) {
        console.log("🔍 Raw dishes found:", parsedResult.dishes.length);
        parsedResult.dishes.forEach((dish: any, index: number) => {
          console.log(`  ${index + 1}. "${dish.name}" - ${dish.price}`);
        });
        
        // Filter out absurd dishes and hallucinations
        const originalCount = parsedResult.dishes.length;
        parsedResult.dishes = parsedResult.dishes.filter((dish: any) => {
          const nameLength = dish.name?.length || 0;
          const price = dish.price || "";
          const priceNumber = parseInt(price.match(/\d+/)?.[0] || "0");
          const dishName = dish.name?.toLowerCase() || "";

          // Detect hallucination patterns
          const isHallucination = 
            dishName.includes("พิเศษ a") || 
            dishName.includes("พิเศษ b") ||
            dishName.includes("พิเศษ c") ||
            dishName.includes("พิเศษ d") ||
            dishName.includes("พิเศษ e") ||
            dishName.includes("พิเศษ f") ||
            dishName.includes("พิเศษ g") ||
            dishName.match(/พิเศษ[abcdefg]/i) ||
            dishName.includes("พิเศษพิเศษ");

          // Reject dishes with absurd properties
          const isValid =
            nameLength < 100 &&
            priceNumber < 1000 && // Allow higher prices for premium dishes
            !dish.name?.includes("ๆๆๆ") && // Reject repeated characters
            nameLength > 2 && // Allow shorter dish names
            !isHallucination; // Reject obvious hallucinations

          if (!isValid) {
            console.log("🚫 Rejected invalid/hallucinated dish:", dish.name);
          }
          return isValid;
        });

        // Limit to maximum 20 dishes
        if (parsedResult.dishes.length > 20) {
          console.log(
            "⚠️ Truncating to 20 dishes from",
            parsedResult.dishes.length
          );
          parsedResult.dishes = parsedResult.dishes.slice(0, 20);
        }

        console.log(`🎯 Filtering: ${originalCount} → ${parsedResult.dishes.length} dishes after validation`);
        
        parsedResult.totalDishes = parsedResult.dishes.length;
        console.log("✅ Final result:", {
          totalDishes: parsedResult.totalDishes,
        });
      }
    } catch (parseError) {
      console.error(
        "❌ JSON parse error. Content length:",
        cleanContent.length
      );
      console.error("❌ Content preview:", cleanContent.substring(0, 500));
      console.error("❌ Content end preview:", cleanContent.substring(-200));

      // Try to fix incomplete JSON by carefully analyzing the structure
      let fixedContent = cleanContent;
      
      // First, try to find where the JSON got truncated
      console.log("🔍 Analyzing truncated JSON...");
      console.log("Last 200 characters:", cleanContent.slice(-200));
      
      // Look for common truncation patterns
      const lastBrace = cleanContent.lastIndexOf('}');
      const lastBracket = cleanContent.lastIndexOf(']');
      const lastQuote = cleanContent.lastIndexOf('"');
      
      console.log("JSON structure analysis:", {
        lastBrace, lastBracket, lastQuote,
        endsWithBrace: cleanContent.trim().endsWith('}'),
        endsWithBracket: cleanContent.trim().endsWith(']'),
        length: cleanContent.length
      });
      
      // If JSON seems truncated in the middle of a string or array
      if (lastQuote > Math.max(lastBrace, lastBracket)) {
        // Truncated in middle of string - try to close it properly
        console.log("🔧 Detected truncation in string, attempting repair...");
        
        // Find the last complete dish entry
        const dishesMatch = cleanContent.match(/"dishes":\s*\[([\s\S]*)/);  
        if (dishesMatch) {
          const dishesContent = dishesMatch[1];
          const lastCompleteItem = dishesContent.lastIndexOf('},{');
          
          if (lastCompleteItem > -1) {
            // Cut off at last complete item and close properly
            const truncatedDishes = dishesContent.substring(0, lastCompleteItem + 1);
            fixedContent = cleanContent.substring(0, cleanContent.indexOf('"dishes":')) + 
                          `"dishes": [${truncatedDishes}], "totalDishes": 0, "language": "th"}`;
            console.log("🔧 Repaired JSON preview:", fixedContent.slice(-100));
          }
        }
      }
      
      try {
        parsedResult = JSON.parse(fixedContent);
        console.log("✅ Successfully parsed repaired JSON");
      } catch (repairError) {
        console.error("❌ Could not repair JSON:", repairError);
        // Return a minimal valid response to prevent complete failure
        parsedResult = {
          dishes: [],
          totalDishes: 0,
          language: "th",
          error: "JSON_PARSE_FAILED",
          originalLength: cleanContent.length
        };
        console.log("⚠️ Returning minimal response due to parse failure");
      }
    }

    const totalTime = Date.now() - startTime;
    console.log("🏁 Total API execution time:", `${totalTime}ms`);
    console.log("📊 Performance breakdown:", {
      requestParsing: `${parseTime}ms`,
      openaiApiCall: `${apiTime}ms`,
      responseProcessing: `${jsonTime}ms`,
      total: `${totalTime}ms`,
    });

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error("❌ Smart parse API error:", error);

    // More detailed error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error details:", errorMessage);

    return NextResponse.json(
      {
        error: "Failed to parse menu with AI",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
