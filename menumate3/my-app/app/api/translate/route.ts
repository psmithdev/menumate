import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const useMock = process.env.USE_MOCK_TRANSLATION === "true";
  console.log("Translation API called, useMock:", useMock);

  if (useMock) {
    // Mock translation result
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return NextResponse.json({
      translatedText: `Kung Pao Chicken - $18.90\nMapo Tofu - $14.50\nShredded Potato with Green Pepper - $12.20\nSweet and Sour Pork - $19.80\nSteamed Egg Custard - $8.80`,
      originalText: `宫保鸡丁 - ¥38\n麻婆豆腐 - ¥28\n青椒土豆丝 - ¥22\n糖醋里脊 - ¥42\n蒸蛋羹 - ¥18`,
      targetLanguage: "en",
      confidence: 0.92,
    });
  }

  try {
    const { text, targetLanguage = "en" } = await request.json();

    if (!text) {
      console.log("No text provided for translation");
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    console.log("Text received for translation, length:", text.length);
    console.log("Text sample:", text.substring(0, 200));
    console.log("Target language:", targetLanguage);

    // Call Google Translate API
    const apiKey = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY;
    if (!apiKey) {
      console.log("No Google Cloud Translate API key found");
      return NextResponse.json(
        { error: "Translation API key not configured" },
        { status: 500 }
      );
    }

    const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const body = {
      q: text,
      target: targetLanguage,
      format: "text",
      // Let Google Translate auto-detect the source language
    };

    console.log("Sending request to Google Translate API...");
    const translateRes = await fetch(translateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    console.log("Google Translate API response status:", translateRes.status);
    if (!translateRes.ok) {
      const errorText = await translateRes.text();
      console.log("Google Translate API error:", errorText);
      return NextResponse.json(
        { error: "Translation failed" },
        { status: 500 }
      );
    }

    const translateData = await translateRes.json();
    console.log("Google Translate API response received");

    const translatedText =
      translateData.data?.translations?.[0]?.translatedText || "";

    console.log("Translated text length:", translatedText.length);
    return NextResponse.json({
      translatedText,
      originalText: text,
      targetLanguage,
      confidence: 1.0,
    });
  } catch (error) {
    console.log("Translation error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
