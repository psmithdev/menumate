// Test script for validating price extraction improvements
// Run this in the browser console or as a test to validate parsing

import { parseThaiMenuLine } from './thaiPriceParser';

// Sample menu text from your image
const SAMPLE_MENU_TEXT = `ข้าวขาหมู
ชาญเทคนิค
พรีเมียม
• BY โจ้ •
เมนูราดข้าว
ข้าวขาหมูบิ๊กเบิ้มเมนู
( ไม่มีไข่กับข้าว
) 70 บาท ต้มซุป
ข้าวขาหมูพ่อบิ๊กเบิ้มรวมขาหมู 120/220 บาท
( เพิ่มหมูเพิ่มข้าวเพิ่มไข่ ) 90 ( เนื้อ
บาท / หนัง / คากิ / ไส้ ) ต้มมะระซี่โครงหมู 60 บาท
เนื้อหนังต้มผักกาดดองซี่โครงหมู -
120/220 ไส้
เครื่อง บาท 60 บาท
เคียงขาหมู 550
เนื้อล้วน
120/220 บาท
ข้าวหอมมะลิ 100 % 10 บาท คาเมนูแนะนํา
120/220 บาท ค
ชาญเทนิ
ไข่ต้ม 10 บาท ไส้
( ) 120/220 บาท เก็กฮวยสูตรโบราณน้ำตาล 3 สี 25 บาท
ผักกาดดองเคียงขาหมู 25 บาท ขาหมูยกขากิโล . ละ 420 บาท * ดัมขายตั้งแต่สมัยบางระจัน
กุนเชียงหมูเกรด A มันน้อยทอดน้ำ 60 บาท ( ชั่งทั้งขา ) โบราณแค่ไหนคิดดู ! CHANT FRE
บ๊ะจ่างทรงเครื่อง 60 บาท`;

export function testPriceExtractionImprovements() {
  console.log('🧪 Testing Price Extraction Improvements');
  console.log('=======================================');
  
  const lines = SAMPLE_MENU_TEXT.split('\n').filter(line => line.trim().length > 0);
  
  const results = {
    totalLines: lines.length,
    validDishes: 0,
    pricesFound: 0,
    accurateExtractions: 0,
    issues: [] as Array<{line: string, issue: string, expected?: string}>
  };
  
  // Expected results for validation
  const expectedDishes = [
    { name: 'ต้มซุป', price: '70' },
    { name: 'ข้าวขาหมูพ่อบิ๊กเบิ้มรวมขาหมู', price: '120/220' },
    { name: 'ต้มมะระซี่โครงหมู', price: '60' },
    { name: 'เคียงขาหมู', price: '550' },
    { name: 'ข้าวหอมมะลิ', price: '10' },
    { name: 'ไข่ต้ม', price: '10' },
    { name: 'เก็กฮวยสูตรโบราณน้ำตาล 3 สี', price: '25' },
    { name: 'ผักกาดดองเคียงขาหมู', price: '25' },
    { name: 'ขาหมูยกขากิโล', price: '420' },
    { name: 'กุนเชียงหมูเกรด A มันน้อยทอดน้ำ', price: '60' },
    { name: 'บ๊ะจ่างทรงเครื่อง', price: '60' }
  ];
  
  console.log('📋 Expected dishes:', expectedDishes.length);
  console.log('');
  
  lines.forEach((line, index) => {
    console.log(`\n📝 Line ${index + 1}: "${line}"`);
    console.log('---'.repeat(25));
    
    try {
      const result = parseThaiMenuLine(line);
      
      if (result.isDish) {
        results.validDishes++;
        
        if (result.isValid && result.prices.length > 0) {
          results.pricesFound++;
          
          // Check if this matches expected results
          const expected = expectedDishes.find(exp => 
            result.dishName.includes(exp.name) || exp.name.includes(result.dishName.substring(0, 10))
          );
          
          if (expected) {
            const extractedPrice = result.prices[0].price.replace(/[^\d\/]/g, '');
            if (extractedPrice === expected.price) {
              results.accurateExtractions++;
              console.log('✅ ACCURATE: Matches expected result');
            } else {
              console.log(`⚠️ INACCURATE: Got "${extractedPrice}", expected "${expected.price}"`);
              results.issues.push({
                line,
                issue: `Price mismatch: got "${extractedPrice}", expected "${expected.price}"`,
                expected: expected.price
              });
            }
          } else {
            console.log('ℹ️ Extracted dish not in expected list (may be correct)');
          }
        } else {
          console.log('❌ Dish identified but no price extracted');
          results.issues.push({
            line,
            issue: 'Dish identified but no price found'
          });
        }
      } else {
        console.log('➖ Not identified as dish (header/non-food)');
      }
      
    } catch (error) {
      console.error('❌ Error processing line:', error);
      results.issues.push({
        line,
        issue: `Processing error: ${error}`
      });
    }
  });
  
  console.log('\n📊 IMPROVEMENT TEST RESULTS');
  console.log('===========================');
  console.log(`Total lines processed: ${results.totalLines}`);
  console.log(`Valid dishes found: ${results.validDishes}`);
  console.log(`Prices extracted: ${results.pricesFound}`);
  console.log(`Accurate extractions: ${results.accurateExtractions}`);
  console.log(`Success rate: ${((results.pricesFound / results.validDishes) * 100).toFixed(1)}%`);
  console.log(`Accuracy rate: ${((results.accurateExtractions / results.pricesFound) * 100).toFixed(1)}%`);
  
  if (results.issues.length > 0) {
    console.log(`\n❌ Issues found (${results.issues.length}):`);
    results.issues.forEach((issue, i) => {
      console.log(`${i + 1}. "${issue.line}"`);
      console.log(`   Issue: ${issue.issue}`);
      if (issue.expected) {
        console.log(`   Expected: ${issue.expected}`);
      }
      console.log('');
    });
  }
  
  return results;
}

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).testPriceExtraction = testPriceExtractionImprovements;
  console.log('🧪 Test function available: testPriceExtraction()');
}

export default testPriceExtractionImprovements;