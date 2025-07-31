import { parseMenuWithAI, SmartMenuResult } from '../smartMenuParser';
import fs from 'fs';
import path from 'path';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Smart Menu Parser - Accuracy Regression Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Thai Pork Leg Menu Parsing', () => {
    const expectedThaiPorkLegMenu: SmartMenuResult = {
      dishes: [
        { name: "ข้าวขาหมูบิ๊กเบิ้ม", price: "70 บาท", category: "rice", confidence: 0.95 },
        { name: "ข้าวขาหมูพ่อบิ๊กเบิ้ม", price: "90 บาท", category: "rice", confidence: 0.95 },
        { name: "ข้าวหอมมะลิ 100%", price: "10 บาท", category: "side", confidence: 0.95 },
        { name: "ไข่ต้ม", price: "10 บาท", category: "side", confidence: 0.95 },
        { name: "ผักกาดดองเคียงขาหมู", price: "25 บาท", category: "side", confidence: 0.9 },
        { name: "กุนเชียงขาหมูตัด มันน้อยทอด", price: "60 บาท", category: "side", confidence: 0.85 },
        { name: "บ๊ะจ่างทรงเครื่อง", price: "90 บาท", category: "side", confidence: 0.9 },
        { name: "รวมขาหมู", price: "120/220 บาท", category: "main", confidence: 0.95 },
        { name: "เนื้อต้นขา", price: "120/220 บาท", category: "main", confidence: 0.95 },
        { name: "เนื้อล้วน", price: "120/220 บาท", category: "main", confidence: 0.95 },
        { name: "คากิ", price: "120/220 บาท", category: "main", confidence: 0.95 },
        { name: "ไส้", price: "120/220 บาท", category: "main", confidence: 0.95 },
        { name: "ขาหมูยกขา", price: "420 บาท", category: "main", confidence: 0.95 },
        { name: "ต้มมะระซี่โครงหมู", price: "60 บาท", category: "soup", confidence: 0.9 },
        { name: "ต้มผักกาดดองซี่โครงหมู-ไส้", price: "60 บาท", category: "soup", confidence: 0.85 },
        { name: "เก๊กฮวยสูตรโบราณน้ำตาล 3 สี", price: "25 บาท", category: "dessert", confidence: 0.9 }
      ],
      totalDishes: 16,
      processingTime: 10000,
      confidence: 0.92,
      language: "th"
    };

    it('should extract exactly 16 dishes from Thai pork leg menu', async () => {
      // Mock successful API response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => expectedThaiPorkLegMenu
      });

      // Create mock image file
      const mockImageFile = new File(['mock image data'], 'pork-leg-menu.jpg', {
        type: 'image/jpeg'
      });

      const result = await parseMenuWithAI(mockImageFile);

      expect(result.totalDishes).toBe(16);
      expect(result.dishes).toHaveLength(16);
      expect(result.language).toBe('th');
    });

    it('should extract specific expected dishes with correct names and prices', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => expectedThaiPorkLegMenu
      });

      const mockImageFile = new File(['mock image data'], 'pork-leg-menu.jpg', {
        type: 'image/jpeg'
      });

      const result = await parseMenuWithAI(mockImageFile);

      // Test key dishes that were extracted in our successful run
      const dishNames = result.dishes.map(d => d.name);
      
      expect(dishNames).toContain("ข้าวขาหมูบิ๊กเบิ้ม");
      expect(dishNames).toContain("ขาหมูยกขา"); // The expensive 420 baht dish
      expect(dishNames).toContain("รวมขาหมู");
      expect(dishNames).toContain("เก๊กฮวยสูตรโบราณน้ำตาล 3 สี");

      // Test prices are preserved correctly
      const expensiveDish = result.dishes.find(d => d.name === "ขาหมูยกขา");
      expect(expensiveDish?.price).toBe("420 บาท");

      const rangePriceDish = result.dishes.find(d => d.name === "รวมขาหมู");
      expect(rangePriceDish?.price).toBe("120/220 บาท");
    });

    it('should maintain confidence scores above 0.8 for clear items', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => expectedThaiPorkLegMenu
      });

      const mockImageFile = new File(['mock image data'], 'pork-leg-menu.jpg', {
        type: 'image/jpeg'
      });

      const result = await parseMenuWithAI(mockImageFile);

      // All dishes should have confidence >= 0.8
      result.dishes.forEach(dish => {
        expect(dish.confidence).toBeGreaterThanOrEqual(0.8);
      });

      // Overall confidence should be reasonable
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('should categorize dishes correctly', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => expectedThaiPorkLegMenu
      });

      const mockImageFile = new File(['mock image data'], 'pork-leg-menu.jpg', {
        type: 'image/jpeg'
      });

      const result = await parseMenuWithAI(mockImageFile);

      const categories = result.dishes.map(d => d.category);
      
      // Should have various categories
      expect(categories).toContain("rice");
      expect(categories).toContain("main");
      expect(categories).toContain("side");
      expect(categories).toContain("soup");
      expect(categories).toContain("dessert");
    });
  });

  describe('Accuracy Regression Prevention', () => {
    it('should never return fewer than 10 dishes for complex menus', async () => {
      // Mock a response with only 5 dishes (regression scenario)
      const regressionResponse = {
        dishes: [
          { name: "ข้าวหมูกรอบ", price: "70 บาท", category: "main", confidence: 0.95 },
          { name: "ข้าวหมูกรอบพิเศษ", price: "90 บาท", category: "main", confidence: 0.95 },
          { name: "ข้าวหมูแดง", price: "70 บาท", category: "main", confidence: 0.95 },
          { name: "ข้าวหมูแดงพิเศษ", price: "90 บาท", category: "main", confidence: 0.95 },
          { name: "(ไม่ใส่เครื่องใน)", price: "+10 บาท", category: "main", confidence: 0.95 }
        ],
        totalDishes: 5,
        processingTime: 9000,
        confidence: 0.95,
        language: "th"
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => regressionResponse
      });

      const mockImageFile = new File(['mock image data'], 'complex-menu.jpg', {
        type: 'image/jpeg'
      });

      const result = await parseMenuWithAI(mockImageFile);

      // This test should FAIL initially - we expect more than 5 dishes
      expect(result.totalDishes).toBeGreaterThanOrEqual(10);
    });

    it('should not extract dishes with wrong menu context (crispy pork vs pork leg)', async () => {
      const wrongContextResponse = {
        dishes: [
          { name: "ข้าวหมูกรอบ", price: "70 บาท", category: "main", confidence: 0.95 }, // Wrong context!
          { name: "ข้าวขาหมูบิ๊กเบิ้ม", price: "70 บาท", category: "rice", confidence: 0.95 }
        ],
        totalDishes: 2,
        processingTime: 9000,
        confidence: 0.95,
        language: "th"
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => wrongContextResponse
      });

      const mockImageFile = new File(['mock image data'], 'pork-leg-menu.jpg', {
        type: 'image/jpeg'
      });

      const result = await parseMenuWithAI(mockImageFile);

      // Should extract dishes consistent with pork leg menu, not crispy pork
      const dishNames = result.dishes.map(d => d.name);
      
      // Should NOT contain crispy pork dishes when processing pork leg menu
      expect(dishNames).not.toContain("ข้าวหมูกรอบ");
      expect(dishNames).not.toContain("ข้าวหมูกรอบพิเศษ");
    });
  });

  describe('Performance Requirements', () => {
    it('should complete within 45 seconds', async () => {
      const fastResponse = {
        dishes: [{ name: "Test Dish", price: "100 บาท", category: "main", confidence: 0.95 }],
        totalDishes: 1,
        processingTime: 30000, // 30 seconds
        confidence: 0.95,
        language: "th"
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => fastResponse
      });

      const mockImageFile = new File(['mock image data'], 'menu.jpg', {
        type: 'image/jpeg'
      });

      const startTime = Date.now();
      const result = await parseMenuWithAI(mockImageFile);
      const actualTime = Date.now() - startTime;

      // Should complete quickly in test (mocked)
      expect(actualTime).toBeLessThan(1000); // Test should be fast due to mocking
      
      // API processing time should be reasonable
      expect(result.processingTime).toBeLessThan(45000);
    });
  });

  describe('Error Handling', () => {
    it('should handle API timeout gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Request timeout'));

      const mockImageFile = new File(['mock image data'], 'menu.jpg', {
        type: 'image/jpeg'
      });

      await expect(parseMenuWithAI(mockImageFile)).rejects.toThrow('Failed to parse menu with AI');
    });

    it('should handle API failure gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      });

      const mockImageFile = new File(['mock image data'], 'menu.jpg', {
        type: 'image/jpeg'
      });

      await expect(parseMenuWithAI(mockImageFile)).rejects.toThrow('AI parsing failed: Internal Server Error');
    });
  });
});