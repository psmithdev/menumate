# MenuMate Filtering System Debugging Guide

## Quick Debug Checklist

### 1. Run Unit Tests First
```bash
npm test -- utils/__tests__/dishParser.test.ts
```
This will test the core dish analysis logic with known inputs.

### 2. Console Debugging Steps

#### Step A: Check Initial OCR Parsing
1. Open browser console
2. Upload menu image
3. Look for: `"Parsed dishes:"` - shows raw dish data with dietary properties

#### Step B: Check Filtering Logic
1. Open Filters screen
2. Enable one filter (e.g., Vegetarian)
3. Click "Apply Filters"
4. Look for detailed filter debug output:
   ```
   === FILTER DEBUG START ===
   Input dishes: X
   Active filters: {...}
   ❌ FILTERED OUT (vegetarian): [dish] - isVegetarian: false
   ✅ PASSED: [dish] - {...}
   === FILTER DEBUG SUMMARY ===
   📊 Result: Y of X dishes passed filters
   ```

### 3. Common Issues & Solutions

#### Issue: "All dishes show vegetarian but filter shows 0"
**Cause**: Filtering logic expects `true` but getting `undefined`
**Debug**: Check console for `isVegetarian: undefined`
**Fix**: Update dish parsing to set boolean values explicitly

#### Issue: "Vegetarian filter too strict/loose"
**Cause**: Ingredient detection logic needs tuning
**Debug**: Look at individual dish analysis in console
**Fix**: Update `ingredientDatabase.ts` or `dishParser.ts` logic

#### Issue: "Price/Spice filters not working"
**Cause**: Price extraction or spice detection failing
**Debug**: Check filter debug logs for price/spice values
**Fix**: Update `extractPriceNumber()` or spice detection logic

## Detailed Analysis Tools

### Test Individual Dishes
```javascript
// In browser console
import { analyzeDish } from '/utils/dishParser';
const result = analyzeDish('茄子炒蛋'); // Test specific dish
console.log(result);
```

### Check Filter State
```javascript
// In React DevTools or console
console.log('Current filters:', filters);
console.log('Parsed dishes:', parsedDishes);
console.log('Filtered dishes:', filteredDishes);
```

### Verify Ingredient Database
```javascript
// Test ingredient detection
import { getAllMeatIndicators, getAllVegetableIndicators } from '/utils/ingredientDatabase';
console.log('Meat indicators:', getAllMeatIndicators());
console.log('Vegetable indicators:', getAllVegetableIndicators());
```

## Best Practices for Efficient Debugging

### 1. Incremental Testing
- Test one filter at a time
- Start with simple English dishes
- Progress to complex Chinese/Thai dishes
- Test edge cases (numbers, empty strings)

### 2. Use Console Groups
```javascript
console.group('Dish Analysis');
console.log('Input:', dishName);
console.log('Analysis:', result);
console.groupEnd();
```

### 3. Performance Monitoring
```javascript
console.time('Filtering');
const filtered = applyFilters(dishes);
console.timeEnd('Filtering');
```

### 4. Data Validation
```javascript
// Check for missing properties
dishes.forEach((dish, i) => {
  if (dish.isVegetarian === undefined) {
    console.warn(`Dish ${i} missing isVegetarian:`, dish.originalName);
  }
});
```

## Quick Fixes for Common Problems

### Fix 1: Reset All Filters
```javascript
setFilters({
  dietary: {
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false
  },
  maxSpiceLevel: 5,
  priceRange: { min: 0, max: 1000 },
  sortBy: 'recommended'
});
```

### Fix 2: Force Reparse Dishes
```javascript
// In console, force reanalysis
const reanalyzedDishes = parsedDishes.map(dish => ({
  ...dish,
  ...analyzeDish(dish.originalName)
}));
setParsedDishes(reanalyzedDishes);
```

### Fix 3: Clear Debug Logs
```javascript
// Temporarily disable debug logs
const originalLog = console.log;
console.log = () => {}; // Disable
// ... test code ...
console.log = originalLog; // Re-enable
```

## Test Cases for Manual Verification

### Vegetarian Dishes (Should Pass Vegetarian Filter)
- ✅ 茄子 (eggplant)
- ✅ 蛋炒饭 (egg fried rice)
- ✅ 青菜豆腐汤 (vegetable tofu soup)
- ✅ Tofu Stir Fry
- ✅ Vegetable Curry

### Non-Vegetarian Dishes (Should Fail Vegetarian Filter)
- ❌ 鸡肉炒饭 (chicken fried rice)
- ❌ 猪肉包子 (pork buns)
- ❌ 牛肉面 (beef noodles)
- ❌ 大肠面线 (intestine noodles)
- ❌ Chicken Curry

### Edge Cases
- 🔍 "5" (number only)
- 🔍 "" (empty string)
- 🔍 "盖浇饭" (generic rice dish)
- 🔍 "Unknown Dish"

## Performance Monitoring

### Expected Performance
- OCR parsing: < 2 seconds
- Dish analysis: < 100ms for 50 dishes
- Filtering: < 50ms for 50 dishes
- UI update: < 100ms

### Performance Issues
If filtering is slow:
1. Check console for excessive logging
2. Verify `useCallback` dependencies
3. Consider memoizing dish analysis results
4. Reduce ingredient database size if needed

## When to Remove Debug Logs

Remove debug console logs when:
1. All unit tests pass consistently
2. Manual testing shows accurate results
3. Performance is within expected ranges
4. User accepts the filtering accuracy

## Emergency Rollback

If filtering breaks completely:
1. Revert to previous working commit
2. Check git history: `git log --oneline -10`
3. Reset to working state: `git reset --hard [commit-hash]`
4. Reapply changes incrementally