import { type NextRequest, NextResponse } from "next/server";

// Mock translation API endpoint
export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage = "en" } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Simulate translation processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock translation results
    const translations: Record<string, string> = {
      宫保鸡丁: "Kung Pao Chicken",
      麻婆豆腐: "Mapo Tofu",
      青椒土豆丝: "Shredded Potato with Green Pepper",
      糖醋里脊: "Sweet and Sour Pork",
      蒸蛋羹: "Steamed Egg Custard",
    };

    const translatedText = text
      .split("\n")
      .map((line: string) => {
        const dishName = line.split(" - ")[0];
        const price = line.split(" - ")[1];
        const translated = translations[dishName] || dishName;
        return price ? `${translated} - ${price}` : translated;
      })
      .join("\n");

    return NextResponse.json({
      translatedText,
      originalText: text,
      targetLanguage,
      confidence: 0.92,
    });
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
