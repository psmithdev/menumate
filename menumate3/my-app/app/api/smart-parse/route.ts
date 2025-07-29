// API route for GPT-4 Vision menu parsing
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
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1500, // Reduced for faster response with simplified prompt
        temperature: 0.1, // Lower temperature for faster, more consistent output
        stream: false, // Keep false for now - streaming requires different handling
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

      // Validate result to prevent hallucinations
      if (parsedResult.dishes) {
        console.log("🔍 Raw dishes found:", parsedResult.dishes.length);
        parsedResult.dishes.forEach((dish: any, index: number) => {
          console.log(`  ${index + 1}. "${dish.name}" - ${dish.price}`);
        });
        
        // Filter out absurd dishes
        const originalCount = parsedResult.dishes.length;
        parsedResult.dishes = parsedResult.dishes.filter((dish: any) => {
          const nameLength = dish.name?.length || 0;
          const price = dish.price || "";
          const priceNumber = parseInt(price.match(/\d+/)?.[0] || "0");

          // Reject dishes with absurd properties
          const isValid =
            nameLength < 100 &&
            priceNumber < 1000 && // Allow higher prices for premium dishes
            !dish.name?.includes("ๆๆๆ") && // Reject repeated characters
            nameLength > 2; // Allow shorter dish names

          if (!isValid) {
            console.log("🚫 Rejected invalid dish:", dish.name);
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

      // Try to fix incomplete JSON by adding closing brackets
      let fixedContent = cleanContent;
      if (!cleanContent.trim().endsWith("}")) {
        // Count opening and closing brackets to balance
        const openBraces = (cleanContent.match(/{/g) || []).length;
        const closeBraces = (cleanContent.match(/}/g) || []).length;
        const openBrackets = (cleanContent.match(/\[/g) || []).length;
        const closeBrackets = (cleanContent.match(/]/g) || []).length;

        // Add missing closing brackets/braces
        fixedContent += "}]".repeat(Math.max(0, openBrackets - closeBrackets));
        fixedContent += "}".repeat(Math.max(0, openBraces - closeBraces));

        console.log(
          "🔧 Attempting to fix JSON with:",
          fixedContent.substring(-100)
        );
        parsedResult = JSON.parse(fixedContent);
      } else {
        throw parseError;
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
