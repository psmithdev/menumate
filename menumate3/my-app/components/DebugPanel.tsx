'use client'

import { useState } from 'react';
import { copyDebugToClipboard, downloadDebugReport } from '../utils/debugExporter';
import testPriceExtractionImprovements from '../utils/testPriceExtraction';

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleCopyDebug = () => {
    copyDebugToClipboard();
    setLastAction('copied');
    setTimeout(() => setLastAction(null), 3000);
  };

  const handleDownloadDebug = () => {
    downloadDebugReport();
    setLastAction('downloaded');
    setTimeout(() => setLastAction(null), 3000);
  };

  const handleTestParsing = () => {
    testPriceExtractionImprovements();
    setLastAction('tested');
    setTimeout(() => setLastAction(null), 3000);
  };

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_ENABLE_DEBUG) {
    return null;
  }

  return (
    <>
      {/* Debug Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all duration-200"
        title="Debug Tools"
      >
        🛠️
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-40 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Debug Tools</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-3">
              Export debugging data for development analysis:
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyDebug}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
              >
                📋 Copy Report
              </button>
              
              <button
                onClick={handleDownloadDebug}
                className="px-3 py-2 bg-green-500 hover:green-600 text-white text-sm rounded transition-colors"
              >
                📥 Download
              </button>
            </div>
            
            <button
              onClick={handleTestParsing}
              className="w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded transition-colors"
            >
              🧪 Test Parsing (Console)
            </button>
            
            {lastAction && (
              <div className="text-sm text-center py-2 px-3 bg-gray-100 rounded">
                {lastAction === 'copied' && '✅ Report copied to clipboard!'}
                {lastAction === 'downloaded' && '✅ Report downloaded!'}
                {lastAction === 'tested' && '✅ Check console for test results!'}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-3 p-2 bg-gray-50 rounded">
              <strong>Console Commands:</strong><br/>
              • <code>MenuMateDebug.copy()</code><br/>
              • <code>MenuMateDebug.download()</code><br/>
              • <code>MenuMateDebug.export()</code>
            </div>
            
            <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
              This panel helps export structured debugging data for analyzing OCR accuracy and price extraction issues.
            </div>
          </div>
        </div>
      )}
    </>
  );
}