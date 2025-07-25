// Manual test for dish analysis
// Run this in browser console to test dish parsing

const testDishes = [
  // Vegetarian dishes (should return isVegetarian: true)
  { name: '茄子', expectVegetarian: true },
  { name: '蛋炒饭', expectVegetarian: true },
  { name: '青菜豆腐汤', expectVegetarian: true },
  { name: 'Tofu Stir Fry', expectVegetarian: true },
  { name: '素食面条', expectVegetarian: true },
  
  // Non-vegetarian dishes (should return isVegetarian: false)
  { name: '鸡肉炒饭', expectVegetarian: false },
  { name: '猪肉包子', expectVegetarian: false },
  { name: '牛肉面', expectVegetarian: false },
  { name: '大肠面线', expectVegetarian: false },
  { name: '火腿三明治', expectVegetarian: false },
  { name: 'Chicken Curry', expectVegetarian: false },
  
  // Edge cases
  { name: '5', expectVegetarian: false },
  { name: '盖浇饭', expectVegetarian: false },
  { name: '', expectVegetarian: false }
];

// Function to run tests (paste in browser console)
function runDishTests() {
  console.log('=== DISH ANALYSIS TESTS ===');
  
  let passed = 0;
  let failed = 0;
  
  testDishes.forEach((test, index) => {
    // Note: analyzeDish function needs to be imported/available
    // This is a template - actual testing requires the function to be available
    console.log(`\nTest ${index + 1}: "${test.name}"`);
    console.log(`Expected vegetarian: ${test.expectVegetarian}`);
    
    // Uncomment when function is available:
    // const result = analyzeDish(test.name);
    // const actual = result.isVegetarian;
    // const success = actual === test.expectVegetarian;
    // 
    // if (success) {
    //   console.log(`✅ PASS: ${test.name} -> ${actual}`);
    //   passed++;
    // } else {
    //   console.log(`❌ FAIL: ${test.name} -> expected: ${test.expectVegetarian}, got: ${actual}`);
    //   failed++;
    // }
  });
  
  console.log(`\n=== TEST SUMMARY ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${testDishes.length}`);
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testDishes, runDishTests };
}