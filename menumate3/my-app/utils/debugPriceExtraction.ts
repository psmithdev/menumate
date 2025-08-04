// Debug utility for testing price extraction improvements
import { parseThaiMenuLine } from './thaiPriceParser';
import { parseTextToDishes } from './smartMenuParser';

// Test cases covering common Thai menu formats
const TEST_CASES = [
  // Standard format: dish name + price + บาท
  'ข้าวผัดกุ้ง 120 บาท',
  'แกงเขียวหวานไก่ 85 บาท',
  'ต้มยำกุ้ง 95 บาท',
  
  // Just numbers (common in menus)
  'ข้าวผัดปู 140',
  'ส้มตำไทย 60',
  'แกงเผ็ดหมู 75',
  
  // Multiple sizes
  'ข้าวซอย เล็ก 50 กลาง 70 ใหญ่ 90',
  'ก๋วยเตี๋ยวเนื้อ S 45 M 65 L 85',
  
  // Slash separated prices
  'น้ำปลาหวาน 80/100/120',
  'ผัดไทย 60/80/100 บาท',
  
  // Price ranges
  'บะหมี่แห้ง 70-90 บาท',
  'ข้าวคลุกกะปิ 55-75',
  
  // Size in parentheses
  'ข้าวผัด (เล็ก) 70 บาท',
  'แกงจืด (ใหญ่) 120',
  
  // Price at beginning
  '150 บาท ข้าวผัดซีฟู้ด',
  '85 ต้มข่าไก่',
  
  // Complex Thai dishes
  'ยำวุ้นเส้นกุ้งสด 110 บาท',
  'แกงส่วนปลาดุกใส่ผักบุ้ง 95',
  'ข้าวผัดน้ำพริกลงเรือ 130',
  
  // Edge cases
  'เมนูอาหารไทย', // Header - should not be detected as dish
  'ราคา 50-200 บาท', // Price only line
  'ร้านอาหารดีลิเชียส', // Restaurant name
  '🌶️🌶️ เผ็ดมาก', // Spice indicator only
  
  // Lines with mixed content
  'ข้าวผัดต้มยำ พิเศษ 140 บาท ⭐',
  'แกงเผ็ดปลาดุก 🌶️ 85',
  
  // Number-only lines (common after dish names)
  '120',
  '85',
  '200',
  
  // Incomplete/fragmented lines
  'ข้าว',
  'กุ้ง 12',
  'แกงเผ็ด หม',
];

export function debugPriceExtraction() {
  console.log('🧪 Starting Price Extraction Debug Tests');
  console.log('=======================================');
  
  const results = {
    totalTests: TEST_CASES.length,
    validParsed: 0,
    pricesFound: 0,
    dishesIdentified: 0,
    failed: [] as string[]
  };
  
  TEST_CASES.forEach((testCase, index) => {
    console.log(`\n📝 Test ${index + 1}: "${testCase}"`);
    console.log('---'.repeat(20));
    
    try {
      const result = parseThaiMenuLine(testCase);
      
      console.log(`Result:`, {
        dishName: result.dishName,
        prices: result.prices,
        isValid: result.isValid,
        isDish: result.isDish
      });
      
      // Update statistics
      if (result.isValid) results.validParsed++;
      if (result.prices.length > 0) results.pricesFound++;
      if (result.isDish) results.dishesIdentified++;
      
      // Evaluate result quality
      const hasThaiText = /[ก-๙]/.test(testCase);
      const hasNumbers = /\d{2,4}/.test(testCase);
      const shouldHavePrice = hasNumbers && hasThaiText && !testCase.includes('เมนู') && !testCase.includes('ร้าน');
      
      if (shouldHavePrice && result.prices.length === 0) {
        console.log('⚠️  Expected price but none found');
        results.failed.push(testCase);
      } else if (result.isValid && result.prices.length > 0) {
        console.log('✅ Successfully parsed with price');
      } else if (result.isDish && hasThaiText) {
        console.log('✅ Correctly identified as dish (no price)');
      } else {
        console.log('ℹ️  Other result');
      }
      
    } catch (error) {
      console.error('❌ Error parsing:', error);
      results.failed.push(testCase);
    }
  });
  
  console.log('\n📊 TEST SUMMARY');
  console.log('===============');
  console.log(`Total tests: ${results.totalTests}`);
  console.log(`Valid parses: ${results.validParsed} (${Math.round(results.validParsed/results.totalTests*100)}%)`);
  console.log(`Prices found: ${results.pricesFound} (${Math.round(results.pricesFound/results.totalTests*100)}%)`);
  console.log(`Dishes identified: ${results.dishesIdentified} (${Math.round(results.dishesIdentified/results.totalTests*100)}%)`);
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed cases (${results.failed.length}):`);
    results.failed.forEach(failure => console.log(`   "${failure}"`));
  }
  
  return results;
}

// Test full menu text parsing
export function debugFullMenuParsing() {
  console.log('\n🍽️ Testing Full Menu Parsing');
  console.log('=============================');
  
  const sampleMenuText = `เมนูอาหารไทย
ข้าวผัดกุ้ง 120 บาท
แกงเขียวหวานไก่ 85
ต้มยำกุ้ง 95 บาท
ส้มตำไทย เล็ก 50 กลาง 70 ใหญ่ 90
ผัดไทย 80/100/120 บาท
น้ำปลาหวาน
85
ข้าวคลุกกะปิ 75
ร้านอาหารดี
แกงเผ็ดหมู 70 บาท`;

  console.log('📄 Sample menu text:');
  console.log(sampleMenuText);
  console.log('');
  
  try {
    // Note: parseTextToDishes is not exported, we'll need to test the smart parser differently
    console.log('⚠️ Full menu parsing would require access to parseTextToDishes function');
    console.log('This should be tested through the API endpoint or by making the function exported');
  } catch (error) {
    console.error('❌ Error in full menu parsing:', error);
  }
}

// Performance testing
export function debugPerformance() {
  console.log('\n⚡ Performance Testing');
  console.log('=====================');
  
  const startTime = Date.now();
  
  // Run price extraction 1000 times
  for (let i = 0; i < 1000; i++) {
    TEST_CASES.forEach(testCase => {
      parseThaiMenuLine(testCase);
    });
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const avgTimePerParse = totalTime / (1000 * TEST_CASES.length);
  
  console.log(`Parsed ${1000 * TEST_CASES.length} lines in ${totalTime}ms`);
  console.log(`Average time per parse: ${avgTimePerParse.toFixed(3)}ms`);
  
  if (avgTimePerParse < 1) {
    console.log('✅ Performance: Excellent (< 1ms per parse)');
  } else if (avgTimePerParse < 5) {
    console.log('✅ Performance: Good (< 5ms per parse)');
  } else {
    console.log('⚠️ Performance: Could be improved (> 5ms per parse)');
  }
}

// Export a function to run all tests
export function runAllDebugTests() {
  console.log('🚀 Running All Price Extraction Debug Tests');
  console.log('===========================================');
  
  const extractionResults = debugPriceExtraction();
  debugFullMenuParsing();
  debugPerformance();
  
  console.log('\n🏁 All tests completed!');
  return extractionResults;
}