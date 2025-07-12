import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const useMock = process.env.USE_MOCK_OCR === "true";
  console.log("OCR API called, useMock:", useMock);

  if (useMock) {
    // Mock OCR result
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return NextResponse.json({
      text: `宫保鸡丁 - ¥38\n麻婆豆腐 - ¥28  \n青椒土豆丝 - ¥22\n糖醋里脊 - ¥42\n蒸蛋羹 - ¥18`,
      confidence: 0.95,
      language: "zh-CN",
    });
  }

  // Parse the image from the request
  const formData = await request.formData();
  const file = formData.get("image") as File;
  if (!file) {
    console.log("No image provided");
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  console.log("Image received:", file.name, file.size, file.type);

  // Read the file as a base64 string
  const arrayBuffer = await file.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString("base64");
  console.log("Image converted to base64, length:", base64Image.length);

  // Call Google Vision API
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    console.log("No Google Cloud Vision API key found");
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }
  console.log("API key found, length:", apiKey.length);

  const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

  const body = {
    requests: [
      {
        image: { content: base64Image },
        features: [{ type: "TEXT_DETECTION" }],
      },
    ],
  };

  console.log("Sending request to Google Vision API...");
  const visionRes = await fetch(visionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  console.log("Google Vision API response status:", visionRes.status);
  if (!visionRes.ok) {
    const errorText = await visionRes.text();
    console.log("Google Vision API error:", errorText);
    return NextResponse.json(
      { error: "Google Vision OCR failed" },
      { status: 500 }
    );
  }

  const visionData = await visionRes.json();
  console.log("Google Vision API response received");
  const text = visionData.responses?.[0]?.fullTextAnnotation?.text || "";

  console.log("Extracted text length:", text.length);
  return NextResponse.json({
    text,
    confidence: 1.0, // Google Vision does not provide a confidence score for full text
    language: "auto",
  });
}
