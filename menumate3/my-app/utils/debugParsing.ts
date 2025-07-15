import { parseThaiMenuLine } from './thaiPriceParser';

// Debug utility to help analyze OCR text parsing
export function debugOcrParsing(ocrText: string): void {
  console.log("=== OCR PARSING DEBUG ===");
  console.log("Raw OCR text:", ocrText);
  
  const lines = ocrText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  
  console.log("Total lines:", lines.length);
  console.log("All lines:", lines);
  
  lines.forEach((line, index) => {
    const parsedLine = parseThaiMenuLine(line);
    console.log(`\nLine ${index + 1}: "${line}"`);
    console.log(`  - isDish: ${parsedLine.isDish}`);
    console.log(`  - isValid: ${parsedLine.isValid}`);
    console.log(`  - dishName: "${parsedLine.dishName}"`);
    console.log(`  - prices: ${JSON.stringify(parsedLine.prices)}`);
  });
  
  console.log("=== END DEBUG ===");
}

// Test function with sample Thai menu text
export function testThaiParsing(): void {
  const sampleText = `
ร้านอาหารไทย
ข้าวผัดกุ้ง 120 บาท
ส้มตำ เล็ก 80 กลาง 100 ใหญ่ 120
น้ำส้ม 45
normal special jumbo
แกงเขียวหวาน 95 บาท
โทร 02-123-4567
  `;
  
  debugOcrParsing(sampleText);
}

// Helper to analyze specific problematic lines
export function analyzeProblematicLines(lines: string[]): void {
  console.log("=== ANALYZING PROBLEMATIC LINES ===");
  
  lines.forEach((line, index) => {
    const parsedLine = parseThaiMenuLine(line);
    console.log(`\nLine ${index + 1}: "${line}"`);
    console.log(`  Result: isDish=${parsedLine.isDish}, isValid=${parsedLine.isValid}`);
    
    if (!parsedLine.isDish) {
      console.log(`  ❌ FILTERED OUT: Line identified as non-dish`);
    } else if (parsedLine.isDish && parsedLine.isValid) {
      console.log(`  ✅ DISH FOUND: "${parsedLine.dishName}" with prices:`, parsedLine.prices);
    } else if (parsedLine.isDish && !parsedLine.isValid) {
      console.log(`  ⚠️ DISH BUT NO PRICE: "${parsedLine.dishName}"`);
    }
  });
  
  console.log("=== END ANALYSIS ===");
}