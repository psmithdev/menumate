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
          },
          // Enhanced context for better menu detection
          cropHintsParams: {
            aspectRatios: [0.8, 1.0, 1.2] // Common menu aspect ratios
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
    
    // Enhanced price detection analysis
    const priceAnnotations = response.textAnnotations.slice(1).filter((ann: any) => {
      const desc = ann.description;
      return /\d+\s*(?:บาท|baht|฿|\$)/.test(desc) || /^\d{2,4}$/.test(desc);
    });
    console.log(`💰 Found ${priceAnnotations.length} potential price annotations:`);
    priceAnnotations.forEach((ann: any, i: number) => {
      console.log(`   Price ${i+1}: "${ann.description}" (conf: ${Math.round((ann.confidence || 0) * 100)}%)`);
    });
    
    // Enhanced dish name detection
    const dishAnnotations = response.textAnnotations.slice(1).filter((ann: any) => {
      const desc = ann.description;
      return /[ก-๙]{2,}/.test(desc) && desc.length > 2 && desc.length < 50;
    });
    console.log(`🍽️ Found ${dishAnnotations.length} potential dish name annotations`);
    
    // If individual annotations seem more complete, use them to enhance the text
    if (totalIndividualLength > fullTextLength * 1.1 || fullTextLength < 800 || text.includes('เครื่องเคี')) {
      console.log(`🔄 Enhancing text extraction with individual annotations...`);
      
      // Group annotations by approximate line position and x coordinate
      interface AnnotationPosition {
        text: string;
        y: number;
        x: number;
        width: number;
        height: number;
        confidence: number;
      }
      
      const annotationsWithPosition: AnnotationPosition[] = response.textAnnotations.slice(1).map((annotation: any) => {
        const vertices = annotation.boundingPoly?.vertices || [];
        let avgY = 0, avgX = 0, width = 0, height = 0;
        if (vertices.length > 0) {
          avgY = vertices.reduce((sum: number, v: any) => sum + (v.y || 0), 0) / vertices.length;
          avgX = vertices.reduce((sum: number, v: any) => sum + (v.x || 0), 0) / vertices.length;
          const minX = Math.min(...vertices.map((v: any) => v.x || 0));
          const maxX = Math.max(...vertices.map((v: any) => v.x || 0));
          const minY = Math.min(...vertices.map((v: any) => v.y || 0));
          const maxY = Math.max(...vertices.map((v: any) => v.y || 0));
          width = maxX - minX;
          height = maxY - minY;
        }
        return {
          text: annotation.description,
          y: avgY,
          x: avgX,
          width,
          height,
          confidence: annotation.confidence || 0
        };
      });
      
      // Sort by Y position first (top to bottom), then by X position (left to right)
      annotationsWithPosition.sort((a: AnnotationPosition, b: AnnotationPosition) => {
        const yDiff = a.y - b.y;
        if (Math.abs(yDiff) < 30) { // Same line if Y difference is small (increased tolerance)
          return a.x - b.x; // Sort by X within the same line
        }
        return yDiff; // Sort by Y between different lines
      });
      
      // Group into lines with some tolerance for Y position
      const lines: Array<{text: string, words: Array<{text: string, confidence: number}>}> = [];
      let currentLine: Array<{text: string, confidence: number}> = [];
      let lastY = -1;
      
      annotationsWithPosition.forEach((item: AnnotationPosition) => {
        if (lastY === -1 || Math.abs(item.y - lastY) < 30) {
          // Same line
          currentLine.push({text: item.text, confidence: item.confidence});
        } else {
          // New line
          if (currentLine.length > 0) {
            const lineText = currentLine.map(w => w.text).join(' ');
            lines.push({text: lineText, words: [...currentLine]});
          }
          currentLine = [{text: item.text, confidence: item.confidence}];
        }
        lastY = item.y;
      });
      
      // Don't forget the last line
      if (currentLine.length > 0) {
        const lineText = currentLine.map(w => w.text).join(' ');
        lines.push({text: lineText, words: currentLine});
      }
      
      // Enhanced line reconstruction with price extraction debugging
      const reconstructedLines: string[] = [];
      lines.forEach((line, lineIndex) => {
        const lineText = line.words.reduce((result, word, index) => {
          if (index === 0) return word.text;
          
          const prevWord = line.words[index - 1].text;
          const currentWord = word.text;
          
          // Enhanced spacing logic
          const prevIsThai = /[ก-๙]/.test(prevWord);
          const currentIsThai = /[ก-๙]/.test(currentWord);
          const prevIsNumber = /^\d+$/.test(prevWord);
          const currentIsNumber = /^\d+$/.test(currentWord);
          const prevIsCurrency = /(?:บาท|baht|฿|\$)/.test(prevWord);
          const currentIsCurrency = /(?:บาท|baht|฿|\$)/.test(currentWord);
          
          // Add space for price patterns
          const needsSpace = (!prevIsThai || !currentIsThai) || 
                            currentIsNumber || prevIsNumber ||
                            currentIsCurrency || prevIsCurrency ||
                            /^\d+/.test(currentWord) || 
                            currentWord.includes('บาท') ||
                            prevWord.includes('บาท');
          
          return result + (needsSpace ? ' ' : '') + currentWord;
        }, '');
        
        // Log line analysis for debugging
        const hasPrice = /\d+\s*(?:บาท|baht|฿)/.test(lineText);
        const hasThai = /[ก-๙]/.test(lineText);
        const avgConfidence = line.words.reduce((sum, w) => sum + w.confidence, 0) / line.words.length;
        
        console.log(`📄 Line ${lineIndex}: "${lineText}" (Thai: ${hasThai}, Price: ${hasPrice}, Conf: ${Math.round(avgConfidence * 100)}%)`);
        
        reconstructedLines.push(lineText);
      });
      
      const reconstructedText = reconstructedLines.join('\n');
      console.log(`🔧 Reconstructed text length: ${reconstructedText.length}`);
      console.log(`🔧 Reconstructed preview: ${reconstructedText.substring(0, 300)}...`);
      
      // Use the more complete version
      if (reconstructedText.length > text.length) {
        text = reconstructedText;
        console.log(`✅ Using reconstructed text (${reconstructedText.length} chars vs ${fullTextLength} chars)`);
      }
    }
    
    // Log some sample detections for debugging
    const sampleAnnotations = response.textAnnotations.slice(1, 15); // Show more samples
    sampleAnnotations.forEach((annotation: any, index: number) => {
      const conf = annotation.confidence ? Math.round(annotation.confidence * 100) : 'N/A';
      const isPriceCandidate = /\d+\s*(?:บาท|baht|฿|\$)/.test(annotation.description) || /^\d{2,4}$/.test(annotation.description);
      const marker = isPriceCandidate ? '💰' : '📝';
      console.log(`   ${marker} ${index + 1}. "${annotation.description}" (conf: ${conf}%)`);
    });
  }

  const totalTime = Date.now() - startTime;
  console.log(`⏱️ Total OCR processing time: ${totalTime}ms (API: ${apiTime}ms)`);
  console.log("📝 Extracted text length:", text.length);
  console.log("📄 Text preview:", text.substring(0, 200) + (text.length > 200 ? "..." : ""));
  
  // Enhanced price extraction analysis
  const priceMatches = text.match(/\d+\s*(?:บาท|baht|฿)/gi) || [];
  const numberMatches = text.match(/\b\d{2,4}\b/g) || [];
  const thaiWords = text.match(/[ก-๙]+/g) || [];
  
  console.log(`🔍 Price Analysis:`);
  console.log(`   💰 Direct price matches: ${priceMatches.length} - [${priceMatches.slice(0, 5).join(', ')}...]`);
  console.log(`   🔢 Number matches (potential prices): ${numberMatches.length} - [${numberMatches.slice(0, 10).join(', ')}...]`);
  console.log(`   🇹🇭 Thai words detected: ${thaiWords.length}`);
  
  // Line-by-line analysis for debugging
  const lines = text.split('\n').filter((line: string) => line.trim().length > 0);
  console.log(`📋 Line-by-line analysis (${lines.length} lines):`);
  lines.slice(0, 10).forEach((line: string, i: number) => {
    const hasPrice = /\d+\s*(?:บาท|baht|฿)/.test(line) || /\b\d{2,4}\b/.test(line);
    const hasThai = /[ก-๙]/.test(line);
    const marker = hasPrice ? '💰' : hasThai ? '🍽️' : '📝';
    const truncated = line.length > 60 ? line.substring(0, 60) + '...' : line;
    console.log(`   ${marker} ${i+1}: "${truncated}"`);
  });
  if (lines.length > 10) {
    console.log(`   ... and ${lines.length - 10} more lines`);
  }
  
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
