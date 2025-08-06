// Advanced debugging system for MenuMate OCR and price extraction
// Provides structured logging and easy export for development

export interface DebugSession {
  sessionId: string;
  timestamp: string;
  imageInfo: {
    name: string;
    size: number;
    type: string;
  };
  ocrResults: {
    processingTime: number;
    textLength: number;
    confidence: number;
    extractedText: string;
    priceMatches: string[];
    potentialPrices: string[];
    thaiWords: number;
    linesAnalyzed: number;
  };
  parsingResults: {
    totalDishes: number;
    dishesWithPrices: number;
    dishesWithoutPrices: number;
    averageConfidence: number;
    rejectedLines: string[];
    parsingIssues: Array<{
      line: string;
      issue: string;
      suggestedFix?: string;
    }>;
    expectedDishes?: number;
    successRate?: number;
    patternMatchingDetails: Array<{
      line: string;
      isDishLine: boolean;
      patternsAttempted: string[];
      patternResults: Array<{
        pattern: string;
        matched: boolean;
        extractedData?: any;
        failureReason?: string;
      }>;
      classification: 'dish' | 'header' | 'price-only' | 'description' | 'other';
      classificationReason: string;
    }>;
    priceExtractionAnalysis: {
      totalPricesFound: number;
      totalPricesExtracted: number;
      extractionFailures: Array<{
        line: string;
        foundPrices: string[];
        extractedPrice?: string;
        failureReason: string;
      }>;
    };
  };
  dishes: Array<{
    name: string;
    price: string;
    confidence: number;
    category?: string;
    isVegetarian?: boolean;
    originalLine?: string;
    processingNotes?: string[];
  }>;
  performanceMetrics: {
    ocrTime: number;
    parsingTime: number;
    totalTime: number;
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    issue: string;
    solution: string;
    codeChange?: string;
  }>;
}

class DebugExporter {
  private currentSession: Partial<DebugSession> = {};
  private logs: string[] = [];
  
  startSession(imageInfo: { name: string; size: number; type: string }) {
    this.currentSession = {
      sessionId: `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      imageInfo,
      ocrResults: {
        processingTime: 0,
        textLength: 0,
        confidence: 0,
        extractedText: '',
        priceMatches: [],
        potentialPrices: [],
        thaiWords: 0,
        linesAnalyzed: 0
      },
      parsingResults: {
        totalDishes: 0,
        dishesWithPrices: 0,
        dishesWithoutPrices: 0,
        averageConfidence: 0,
        rejectedLines: [],
        parsingIssues: [],
        patternMatchingDetails: [],
        priceExtractionAnalysis: {
          totalPricesFound: 0,
          totalPricesExtracted: 0,
          extractionFailures: []
        }
      },
      recommendations: [],
      dishes: [],
      performanceMetrics: {
        ocrTime: 0,
        parsingTime: 0,
        totalTime: 0
      }
    };
    this.logs = [];
    console.log(`🚀 Debug session started: ${this.currentSession.sessionId}`);
  }
  
  logOCRResults(results: any) {
    if (!this.currentSession.ocrResults) return;
    
    const priceAnalysis = this.extractPriceMatches(results.text || '');
    
    this.currentSession.ocrResults = {
      processingTime: results.processingTime || 0,
      textLength: results.text?.length || 0,
      confidence: results.confidence || 0,
      extractedText: results.text || '',
      priceMatches: priceAnalysis.directMatches,
      potentialPrices: priceAnalysis.potentialPrices,
      thaiWords: this.countThaiWords(results.text || ''),
      linesAnalyzed: (results.text || '').split('\\n').length
    };
    
    console.log(`📊 OCR Results logged: ${this.currentSession.ocrResults.textLength} chars, ${this.currentSession.ocrResults.priceMatches.length} direct prices, ${this.currentSession.ocrResults.potentialPrices.length} potential prices`);
  }
  
  logParsingIssue(line: string, issue: string, suggestedFix?: string) {
    if (!this.currentSession.parsingResults) return;
    
    this.currentSession.parsingResults.parsingIssues.push({
      line,
      issue,
      suggestedFix
    });
    
    console.log(`⚠️ Parsing issue: ${issue} for line: "${line}"`);
  }
  
  logDishResult(dish: any, originalLine?: string, notes?: string[]) {
    if (!this.currentSession.dishes) return;
    
    this.currentSession.dishes.push({
      name: dish.name,
      price: dish.price,
      confidence: dish.confidence,
      category: dish.category,
      isVegetarian: dish.isVegetarian,
      originalLine,
      processingNotes: notes
    });
  }
  
  logRejectedLine(line: string, reason: string) {
    if (!this.currentSession.parsingResults) return;
    
    this.currentSession.parsingResults.rejectedLines.push(`${line} (${reason})`);
    console.log(`❌ Rejected line: "${line}" - ${reason}`);
  }

  logPatternMatchingDetails(
    line: string, 
    isDishLine: boolean, 
    patternsAttempted: string[], 
    patternResults: Array<{
      pattern: string;
      matched: boolean;
      extractedData?: any;
      failureReason?: string;
    }>,
    classification: 'dish' | 'header' | 'price-only' | 'description' | 'other',
    classificationReason: string
  ) {
    if (!this.currentSession.parsingResults) return;
    
    this.currentSession.parsingResults.patternMatchingDetails.push({
      line,
      isDishLine,
      patternsAttempted,
      patternResults,
      classification,
      classificationReason
    });
    
    console.log(`🔍 Pattern analysis for "${line}": ${classification} (${classificationReason})`);
  }

  logPriceExtractionFailure(line: string, foundPrices: string[], extractedPrice: string | undefined, failureReason: string) {
    if (!this.currentSession.parsingResults) return;
    
    this.currentSession.parsingResults.priceExtractionAnalysis.extractionFailures.push({
      line,
      foundPrices,
      extractedPrice,
      failureReason
    });

    // Update totals
    this.currentSession.parsingResults.priceExtractionAnalysis.totalPricesFound += foundPrices.length;
    if (extractedPrice && extractedPrice !== 'Price not detected' && extractedPrice !== 'Price not shown') {
      this.currentSession.parsingResults.priceExtractionAnalysis.totalPricesExtracted++;
    }
    
    console.log(`💰 Price extraction failed for "${line}": found ${foundPrices.length} prices, extracted: ${extractedPrice || 'none'} - ${failureReason}`);
  }

  addRecommendation(priority: 'high' | 'medium' | 'low', issue: string, solution: string, codeChange?: string) {
    if (!this.currentSession.recommendations) return;
    
    this.currentSession.recommendations.push({
      priority,
      issue,
      solution,
      codeChange
    });
    
    console.log(`💡 ${priority.toUpperCase()} PRIORITY: ${issue} - ${solution}`);
  }

  setExpectedDishes(count: number) {
    if (!this.currentSession.parsingResults) return;
    
    this.currentSession.parsingResults.expectedDishes = count;
    console.log(`🎯 Expected dishes set to: ${count}`);
  }
  
  finalizeParsing(finalResults: any) {
    if (!this.currentSession.parsingResults || !this.currentSession.dishes) return;
    
    const dishesWithPrices = this.currentSession.dishes.filter(d => 
      d.price && d.price !== 'Price not detected' && d.price !== 'Price not shown'
    ).length;

    // Calculate success rate if expected dishes is set
    let successRate = 0;
    if (this.currentSession.parsingResults.expectedDishes) {
      successRate = (this.currentSession.dishes.length / this.currentSession.parsingResults.expectedDishes) * 100;
    }
    
    this.currentSession.parsingResults = {
      ...this.currentSession.parsingResults,
      totalDishes: this.currentSession.dishes.length,
      dishesWithPrices,
      dishesWithoutPrices: this.currentSession.dishes.length - dishesWithPrices,
      averageConfidence: this.currentSession.dishes.length > 0 ? 
        this.currentSession.dishes.reduce((sum, d) => sum + d.confidence, 0) / this.currentSession.dishes.length : 0,
      successRate
    };

    // Generate automated recommendations
    this.generateAutomaticRecommendations();
    
    console.log(`✅ Parsing finalized: ${this.currentSession.parsingResults.totalDishes} dishes, ${dishesWithPrices} with prices, ${successRate.toFixed(1)}% success rate`);
  }

  private generateAutomaticRecommendations() {
    if (!this.currentSession.parsingResults || !this.currentSession.recommendations) return;

    const results = this.currentSession.parsingResults;
    
    // High priority: Low dish detection rate
    if (results.expectedDishes && results.totalDishes < results.expectedDishes * 0.5) {
      this.addRecommendation(
        'high',
        'Very low dish detection rate',
        'Review isDishLine() logic - many valid dishes may be classified as headers',
        'Examine the dish classification patterns in dishParser.ts'
      );
    }

    // High priority: No price extraction despite prices found
    if (results.priceExtractionAnalysis.totalPricesFound > 0 && results.priceExtractionAnalysis.totalPricesExtracted === 0) {
      this.addRecommendation(
        'high',
        'Price extraction completely failing',
        'Review price extraction regex patterns - prices are detected but not extracted',
        'Check price extraction patterns in dishParser.ts parseDishLine() function'
      );
    }

    // Medium priority: Low price extraction rate
    const priceExtractionRate = results.priceExtractionAnalysis.totalPricesFound > 0 ? 
      (results.priceExtractionAnalysis.totalPricesExtracted / results.priceExtractionAnalysis.totalPricesFound) * 100 : 0;
    
    if (priceExtractionRate < 50 && results.priceExtractionAnalysis.totalPricesFound > 5) {
      this.addRecommendation(
        'medium',
        'Low price extraction success rate',
        'Improve regex patterns to handle Thai price formats like "120/220 บาท"',
        'Add support for slash-separated prices and better Thai number parsing'
      );
    }

    // Medium priority: Many pattern matching failures
    const patternFailures = results.patternMatchingDetails.filter(d => d.isDishLine && d.patternResults.every(p => !p.matched));
    if (patternFailures.length > 3) {
      this.addRecommendation(
        'medium',
        'Multiple pattern matching failures',
        'Add new regex patterns to handle Thai dish name formats',
        'Review failed lines and add specific patterns for common Thai dish structures'
      );
    }

    // Low priority: Performance optimization
    if (this.currentSession.ocrResults && this.currentSession.ocrResults.processingTime > 5000) {
      this.addRecommendation(
        'low',
        'Slow OCR processing',
        'Consider image preprocessing or OCR optimization',
        'Review image compression and OCR API settings'
      );
    }
  }
  
  exportDebugData(): DebugSession {
    return this.currentSession as DebugSession;
  }
  
  exportForDeveloper(): string {
    const debugData = this.exportDebugData();
    
    // Handle case where no debug session has been started
    if (!debugData.sessionId) {
      return `
# MenuMate Debug Report
**Status:** No debug session active

## Instructions
1. Upload a menu image to start a debug session
2. The debug data will be automatically collected during OCR processing
3. Return here to export the debug report

## Manual Testing
You can run manual tests in the console:
- \`testPriceExtraction()\` - Test price parsing with sample data
- \`MenuMateDebug.export()\` - Export current debug data
`;
    }
    
    const summary = `
# MenuMate Debug Report
**Session:** ${debugData.sessionId || 'Unknown'}
**Timestamp:** ${debugData.timestamp || 'Unknown'}

## Image Info
- **File:** ${debugData.imageInfo?.name || 'No image processed'}
- **Size:** ${debugData.imageInfo?.size ? (debugData.imageInfo.size / 1024 / 1024).toFixed(2) + 'MB' : 'Unknown'}
- **Type:** ${debugData.imageInfo?.type || 'Unknown'}

## OCR Performance
- **Processing Time:** ${debugData.ocrResults?.processingTime || 0}ms
- **Text Length:** ${debugData.ocrResults?.textLength || 0} characters
- **Confidence:** ${debugData.ocrResults?.confidence ? (debugData.ocrResults.confidence * 100).toFixed(1) : 0}%
- **Thai Words:** ${debugData.ocrResults?.thaiWords || 0}
- **Direct Price Matches:** ${debugData.ocrResults?.priceMatches?.length || 0}
- **Potential Prices:** ${debugData.ocrResults?.potentialPrices?.length || 0}
- **Lines:** ${debugData.ocrResults?.linesAnalyzed || 0}

## Parsing Results
- **Expected Dishes:** ${debugData.parsingResults?.expectedDishes || 'Not specified'}
- **Total Dishes Found:** ${debugData.parsingResults?.totalDishes || 0}
- **With Prices:** ${debugData.parsingResults?.dishesWithPrices || 0}
- **Without Prices:** ${debugData.parsingResults?.dishesWithoutPrices || 0}
- **Detection Success Rate:** ${debugData.parsingResults?.successRate ? debugData.parsingResults.successRate.toFixed(1) + '%' : 'N/A'}
- **Price Success Rate:** ${debugData.parsingResults?.totalDishes ? ((debugData.parsingResults.dishesWithPrices / debugData.parsingResults.totalDishes) * 100).toFixed(1) + '%' : '0%'}
- **Average Confidence:** ${debugData.parsingResults?.averageConfidence ? (debugData.parsingResults.averageConfidence * 100).toFixed(1) + '%' : '0%'}

## Price Extraction Analysis
- **Total Prices Found in OCR:** ${debugData.parsingResults?.priceExtractionAnalysis?.totalPricesFound || 0}
- **Total Prices Successfully Extracted:** ${debugData.parsingResults?.priceExtractionAnalysis?.totalPricesExtracted || 0}
- **Price Extraction Rate:** ${debugData.parsingResults?.priceExtractionAnalysis?.totalPricesFound ? 
  ((debugData.parsingResults.priceExtractionAnalysis.totalPricesExtracted / debugData.parsingResults.priceExtractionAnalysis.totalPricesFound) * 100).toFixed(1) + '%' : '0%'}

### Price Extraction Failures (${debugData.parsingResults?.priceExtractionAnalysis?.extractionFailures?.length || 0})
${debugData.parsingResults?.priceExtractionAnalysis?.extractionFailures?.map(failure => 
  `- **"${failure.line}"**\\n  - Found prices: [${failure.foundPrices.join(', ')}]\\n  - Extracted: ${failure.extractedPrice || 'none'}\\n  - Reason: ${failure.failureReason}`
).join('\\n') || 'No extraction failures recorded'}

## Pattern Matching Analysis (${debugData.parsingResults?.patternMatchingDetails?.length || 0} lines)
${debugData.parsingResults?.patternMatchingDetails?.map(detail => 
  `### "${detail.line}"\\n- **Classification:** ${detail.classification} (${detail.classificationReason})\\n- **Is Dish Line:** ${detail.isDishLine}\\n- **Patterns Attempted:** ${detail.patternsAttempted.join(', ')}\\n- **Pattern Results:**\\n${detail.patternResults.map(p => `  - ${p.pattern}: ${p.matched ? '✅ Matched' : '❌ Failed'}${p.failureReason ? ' (' + p.failureReason + ')' : ''}`).join('\\n')}`
).join('\\n\\n') || 'No pattern matching details recorded'}

## Automated Recommendations
${debugData.recommendations?.map(rec => 
  `### ${rec.priority.toUpperCase()} PRIORITY: ${rec.issue}\\n**Solution:** ${rec.solution}${rec.codeChange ? '\\n**Code Change:** ' + rec.codeChange : ''}`
).join('\\n\\n') || 'No recommendations generated'}

## Traditional Issues Found (${debugData.parsingResults?.parsingIssues?.length || 0})
${debugData.parsingResults?.parsingIssues?.map(issue => 
  `- **${issue.issue}**: "${issue.line}"${issue.suggestedFix ? ` (Fix: ${issue.suggestedFix})` : ''}`
).join('\\n') || 'No issues recorded'}

## Rejected Lines (${debugData.parsingResults?.rejectedLines?.length || 0})
${debugData.parsingResults?.rejectedLines?.map(line => `- ${line}`).join('\\n') || 'No rejections recorded'}

## Detected Dishes
${debugData.dishes?.map((dish, i) => 
  `${i+1}. **${dish.name}** - ${dish.price} (${(dish.confidence * 100).toFixed(0)}% confidence)${dish.processingNotes ? ' - ' + dish.processingNotes.join(', ') : ''}`
).join('\\n') || 'No dishes detected'}

## Raw OCR Text
\\\`\\\`\\\`
${debugData.ocrResults?.extractedText || 'No OCR text available'}
\\\`\\\`\\\`

## Direct Price Matches Found
${debugData.ocrResults?.priceMatches?.map(price => `- ${price}`).join('\\n') || 'No direct price matches found'}

## Potential Price Numbers Found  
${debugData.ocrResults?.potentialPrices?.map(price => `- ${price}`).join('\\n') || 'No potential prices found'}
`;
    
    return summary;
  }
  
  downloadDebugReport() {
    const report = this.exportForDeveloper();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menumate_debug_${this.currentSession.sessionId}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`📥 Debug report downloaded: menumate_debug_${this.currentSession.sessionId}.md`);
  }
  
  copyToClipboard() {
    const report = this.exportForDeveloper();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(report).then(() => {
        console.log('📋 Debug report copied to clipboard');
        alert('Debug report copied to clipboard! You can now paste it to share with the developer.');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = report;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('📋 Debug report copied to clipboard (fallback)');
      alert('Debug report copied to clipboard! You can now paste it to share with the developer.');
    }
  }
  
  private extractPriceMatches(text: string): { directMatches: string[], potentialPrices: string[] } {
    // Enhanced regex to handle Thai price formats including พิเศษ (special), กิโลละ (per kilo), etc.
    // Need to match the actual format: "number พิเศษ number" or "number บาท"
    const directMatches = text.match(/\d+\s*(?:บาท|baht|฿)|\d+\s*พิเศษ\s*\d+/gi) || [];
    
    // Better potential price detection that filters out phone numbers and other non-price numbers
    const potentialPrices = text.match(/\b\d{2,4}\b/g) || [];
    const filteredPotentialPrices = potentialPrices.filter(price => {
      const num = parseInt(price);
      
      // Check if this number is part of a phone number pattern
      const phoneNumberPattern = /\d{3}-\d{7}|\d{10}/;
      const isInPhoneNumber = phoneNumberPattern.test(text) && text.includes(price);
      
      // Filter out phone number segments (like 093, 0969) and focus on reasonable price range
      return num >= 10 && num <= 1000 && 
             !price.startsWith('0') && // Exclude numbers starting with 0 (likely phone numbers)
             !isInPhoneNumber && // Exclude if part of phone number
             price.length <= 3; // Most Thai food prices are 2-3 digits
    });
    
    return {
      directMatches,
      potentialPrices: filteredPotentialPrices.slice(0, 20) // Include more for analysis
    };
  }
  
  private countThaiWords(text: string): number {
    const thaiWords = text.match(/[ก-๙]+/g) || [];
    return thaiWords.length;
  }
}

// Create global debug exporter instance
export const debugExporter = new DebugExporter();

// Convenience functions for easy integration
export function startDebugSession(imageInfo: { name: string; size: number; type: string }) {
  debugExporter.startSession(imageInfo);
}

export function logOCRResults(results: any) {
  debugExporter.logOCRResults(results);
}

export function logParsingIssue(line: string, issue: string, suggestedFix?: string) {
  debugExporter.logParsingIssue(line, issue, suggestedFix);
}

export function logDishResult(dish: any, originalLine?: string, notes?: string[]) {
  debugExporter.logDishResult(dish, originalLine, notes);
}

export function logRejectedLine(line: string, reason: string) {
  debugExporter.logRejectedLine(line, reason);
}

export function finalizeParsing(finalResults: any) {
  debugExporter.finalizeParsing(finalResults);
}

export function exportDebugReport() {
  return debugExporter.exportForDeveloper();
}

export function downloadDebugReport() {
  debugExporter.downloadDebugReport();
}

export function copyDebugToClipboard() {
  debugExporter.copyToClipboard();
}

export function logPatternMatchingDetails(
  line: string, 
  isDishLine: boolean, 
  patternsAttempted: string[], 
  patternResults: Array<{
    pattern: string;
    matched: boolean;
    extractedData?: any;
    failureReason?: string;
  }>,
  classification: 'dish' | 'header' | 'price-only' | 'description' | 'other',
  classificationReason: string
) {
  debugExporter.logPatternMatchingDetails(line, isDishLine, patternsAttempted, patternResults, classification, classificationReason);
}

export function logPriceExtractionFailure(line: string, foundPrices: string[], extractedPrice: string | undefined, failureReason: string) {
  debugExporter.logPriceExtractionFailure(line, foundPrices, extractedPrice, failureReason);
}

export function addRecommendation(priority: 'high' | 'medium' | 'low', issue: string, solution: string, codeChange?: string) {
  debugExporter.addRecommendation(priority, issue, solution, codeChange);
}

export function setExpectedDishes(count: number) {
  debugExporter.setExpectedDishes(count);
}

// Add global debug functions to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).MenuMateDebug = {
    export: exportDebugReport,
    download: downloadDebugReport,
    copy: copyDebugToClipboard,
    raw: () => debugExporter.exportDebugData()
  };
  
  console.log('🛠️ Debug tools available: MenuMateDebug.copy(), MenuMateDebug.download(), MenuMateDebug.export()');
}