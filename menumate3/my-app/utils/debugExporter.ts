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
        thaiWords: 0,
        linesAnalyzed: 0
      },
      parsingResults: {
        totalDishes: 0,
        dishesWithPrices: 0,
        dishesWithoutPrices: 0,
        averageConfidence: 0,
        rejectedLines: [],
        parsingIssues: []
      },
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
    
    this.currentSession.ocrResults = {
      processingTime: results.processingTime || 0,
      textLength: results.text?.length || 0,
      confidence: results.confidence || 0,
      extractedText: results.text || '',
      priceMatches: this.extractPriceMatches(results.text || ''),
      thaiWords: this.countThaiWords(results.text || ''),
      linesAnalyzed: (results.text || '').split('\\n').length
    };
    
    console.log(`📊 OCR Results logged: ${this.currentSession.ocrResults.textLength} chars, ${this.currentSession.ocrResults.priceMatches.length} prices`);
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
  
  finalizeParsing(finalResults: any) {
    if (!this.currentSession.parsingResults || !this.currentSession.dishes) return;
    
    const dishesWithPrices = this.currentSession.dishes.filter(d => 
      d.price && d.price !== 'Price not detected' && d.price !== 'Price not shown'
    ).length;
    
    this.currentSession.parsingResults = {
      ...this.currentSession.parsingResults,
      totalDishes: this.currentSession.dishes.length,
      dishesWithPrices,
      dishesWithoutPrices: this.currentSession.dishes.length - dishesWithPrices,
      averageConfidence: this.currentSession.dishes.reduce((sum, d) => sum + d.confidence, 0) / this.currentSession.dishes.length
    };
    
    console.log(`✅ Parsing finalized: ${this.currentSession.parsingResults.totalDishes} dishes, ${dishesWithPrices} with prices`);
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
- **Price Matches:** ${debugData.ocrResults?.priceMatches?.length || 0}
- **Lines:** ${debugData.ocrResults?.linesAnalyzed || 0}

## Parsing Results
- **Total Dishes:** ${debugData.parsingResults?.totalDishes || 0}
- **With Prices:** ${debugData.parsingResults?.dishesWithPrices || 0}
- **Without Prices:** ${debugData.parsingResults?.dishesWithoutPrices || 0}
- **Success Rate:** ${debugData.parsingResults?.totalDishes ? ((debugData.parsingResults.dishesWithPrices / debugData.parsingResults.totalDishes) * 100).toFixed(1) : 0}%
- **Average Confidence:** ${debugData.parsingResults?.averageConfidence ? (debugData.parsingResults.averageConfidence * 100).toFixed(1) : 0}%

## Issues Found (${debugData.parsingResults?.parsingIssues?.length || 0})
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

## Price Matches Found
${debugData.ocrResults?.priceMatches?.map(price => `- ${price}`).join('\\n') || 'No price matches found'}
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
  
  private extractPriceMatches(text: string): string[] {
    const priceMatches = text.match(/\\d+\\s*(?:บาท|baht|฿)/gi) || [];
    const numberMatches = text.match(/\\b\\d{2,4}\\b/g) || [];
    return [...priceMatches, ...numberMatches.slice(0, 10)]; // Limit numbers to prevent spam
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