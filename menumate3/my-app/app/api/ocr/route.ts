import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const useMock = process.env.USE_MOCK_OCR === "true";
  console.log("📥 OCR API called, useMock:", useMock);

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

  // Read the file as a base64 string with optimization
  const arrayBuffer = await file.arrayBuffer();
  let base64Image = Buffer.from(arrayBuffer).toString("base64");
  
  // Optimize image size for better performance (Google Vision recommends < 20MB)
  const imageSizeMB = base64Image.length * 0.75 / (1024 * 1024); // Approximate actual image size
  console.log(`📷 Original image size: ~${imageSizeMB.toFixed(2)}MB`);
  
  if (imageSizeMB > 10) {
    console.log("⚠️ Large image detected, consider preprocessing for better performance");
  }
  
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
        features: [
          { type: "TEXT_DETECTION", maxResults: 200 },
          { type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }
        ],
        imageContext: {
          languageHints: ["th", "en"], // Thai and English for menu parsing
          textDetectionParams: {
            enableTextDetectionConfidenceScore: true
          }
        }
      },
    ],
  };

  console.log("🚀 Sending request to Google Vision API...");
  const apiStartTime = Date.now();
  const visionRes = await fetch(visionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const apiTime = Date.now() - apiStartTime;
  console.log(`📡 Google Vision API response: ${visionRes.status} (${apiTime}ms)`);
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
  
  const response = visionData.responses?.[0];
  if (!response) {
    return NextResponse.json({ error: "No response from Google Vision" }, { status: 500 });
  }

  // Get text from DOCUMENT_TEXT_DETECTION for better structure
  let text = response.fullTextAnnotation?.text || "";
  let confidence = 1.0;
  
  // Calculate average confidence from text annotations if available
  if (response.textAnnotations && response.textAnnotations.length > 0) {
    const textAnnotations = response.textAnnotations.slice(1); // Skip first one (full text)
    const confidences = textAnnotations
      .filter((annotation: any) => annotation.confidence !== undefined)
      .map((annotation: any) => annotation.confidence);
    
    if (confidences.length > 0) {
      confidence = confidences.reduce((sum: number, conf: number) => sum + conf, 0) / confidences.length;
      console.log(`📊 OCR confidence: ${Math.round(confidence * 100)}% (from ${confidences.length} annotations)`);
    }
  }

  // Enhanced text extraction: if fullText seems incomplete, reconstruct from individual annotations
  if (response.textAnnotations && response.textAnnotations.length > 1) {
    console.log(`📝 Found ${response.textAnnotations.length - 1} text annotations`);
    
    // Check if fullText seems truncated or incomplete
    const fullTextLength = text.length;
    const individualTexts = response.textAnnotations.slice(1).map((ann: any) => ann.description);
    const totalIndividualLength = individualTexts.join(' ').length;
    
    console.log(`📏 Full text length: ${fullTextLength}, Individual texts total: ${totalIndividualLength}`);
    
    // If individual annotations seem more complete, use them to enhance the text
    if (totalIndividualLength > fullTextLength * 1.1 || fullTextLength < 800 || text.includes('เครื่องเคี')) {
      console.log(`🔄 Enhancing text extraction with individual annotations...`);
      
      // Group annotations by approximate line position and x coordinate
      const annotationsWithPosition = response.textAnnotations.slice(1).map((annotation: any) => {
        const vertices = annotation.boundingPoly?.vertices || [];
        let avgY = 0, avgX = 0;
        if (vertices.length > 0) {
          avgY = vertices.reduce((sum: number, v: any) => sum + (v.y || 0), 0) / vertices.length;
          avgX = vertices.reduce((sum: number, v: any) => sum + (v.x || 0), 0) / vertices.length;
        }
        return {
          text: annotation.description,
          y: avgY,
          x: avgX
        };
      });
      
      // Sort by Y position first (top to bottom), then by X position (left to right)
      annotationsWithPosition.sort((a, b) => {
        const yDiff = a.y - b.y;
        if (Math.abs(yDiff) < 25) { // Same line if Y difference is small
          return a.x - b.x; // Sort by X within the same line
        }
        return yDiff; // Sort by Y between different lines
      });
      
      // Group into lines with some tolerance for Y position
      const lines: string[][] = [];
      let currentLine: string[] = [];
      let lastY = -1;
      
      annotationsWithPosition.forEach(item => {
        if (lastY === -1 || Math.abs(item.y - lastY) < 25) {
          // Same line
          currentLine.push(item.text);
        } else {
          // New line
          if (currentLine.length > 0) {
            lines.push([...currentLine]);
          }
          currentLine = [item.text];
        }
        lastY = item.y;
      });
      
      // Don't forget the last line
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      
      // Join each line and then join all lines
      const reconstructedText = lines.map(line => line.join(' ')).join('\n');
      console.log(`🔧 Reconstructed text length: ${reconstructedText.length}`);
      console.log(`🔧 Reconstructed preview: ${reconstructedText.substring(0, 300)}...`);
      
      // Use the more complete version
      if (reconstructedText.length > text.length) {
        text = reconstructedText;
        console.log(`✅ Using reconstructed text (${reconstructedText.length} chars vs ${fullTextLength} chars)`);
      }
    }
    
    // Log some sample detections for debugging
    const sampleAnnotations = response.textAnnotations.slice(1, 10);
    sampleAnnotations.forEach((annotation: any, index: number) => {
      console.log(`   ${index + 1}. "${annotation.description}" (conf: ${annotation.confidence || 'N/A'})`);
    });
  }

  const totalTime = Date.now() - startTime;
  console.log(`⏱️ Total OCR processing time: ${totalTime}ms (API: ${apiTime}ms)`);
  console.log("📝 Extracted text length:", text.length);
  console.log("📄 Text preview:", text.substring(0, 200) + (text.length > 200 ? "..." : ""));
  
  // Performance analysis
  if (totalTime > 10000) {
    console.log("🐌 SLOW: OCR took >10s - check image size or network");
  } else if (totalTime > 5000) {
    console.log("⚠️ MODERATE: OCR took >5s - room for improvement");
  } else {
    console.log("⚡ FAST: OCR completed in <5s - good performance!");
  }
  
  return NextResponse.json({
    text,
    confidence: Math.round(confidence * 100) / 100,
    language: "auto",
    processingTime: totalTime,
    metadata: {
      textAnnotationsCount: response.textAnnotations?.length || 0,
      avgConfidence: Math.round(confidence * 100),
      apiTime: apiTime
    }
  });
}
