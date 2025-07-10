import { type NextRequest, NextResponse } from "next/server";

// Mock OCR API endpoint
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Simulate OCR processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock OCR results
    const mockOcrResult = {
      text: `宫保鸡丁 - ¥38
麻婆豆腐 - ¥28  
青椒土豆丝 - ¥22
糖醋里脊 - ¥42
蒸蛋羹 - ¥18`,
      confidence: 0.95,
      language: "zh-CN",
    };

    return NextResponse.json(mockOcrResult);
  } catch {
    return NextResponse.json(
      { error: "OCR processing failed" },
      { status: 500 }
    );
  }
}
