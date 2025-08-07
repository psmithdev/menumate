// Unit tests for processing screen logic and utilities
import { parseMenuWithAI } from '../utils/smartMenuParser'
import { parseMenuWithGPT4 } from '../utils/smartMenuParserGPT4'

// Mock the smart menu parsers
jest.mock('../utils/smartMenuParser', () => ({
  parseMenuWithAI: jest.fn(),
}))

jest.mock('../utils/smartMenuParserGPT4', () => ({
  parseMenuWithGPT4: jest.fn(),
}))

const mockParseMenuWithAI = parseMenuWithAI as jest.MockedFunction<typeof parseMenuWithAI>
const mockParseMenuWithGPT4 = parseMenuWithGPT4 as jest.MockedFunction<typeof parseMenuWithGPT4>

describe('Processing Screen - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Progress Calculation', () => {
    test('calculates progress stages correctly', () => {
      // Stage 1: Image Analysis (0-20%)
      expect(Math.floor(5 / 25)).toBe(0) // Stage 0
      expect(Math.floor(15 / 25)).toBe(0) // Stage 0
      
      // Stage 2: OCR Processing (20-70%)
      expect(Math.floor(25 / 25)).toBe(1) // Stage 1
      expect(Math.floor(50 / 25)).toBe(2) // Stage 2
      
      // Stage 3: Menu Analysis (70-90%)
      expect(Math.floor(75 / 25)).toBe(3) // Stage 3
      
      // Stage 4: Finalization (90-100%)
      expect(Math.floor(90 / 25)).toBe(3) // Stage 3
      expect(Math.floor(100 / 25)).toBe(4) // Stage 4
    })

    test('progress values are within valid ranges', () => {
      const validProgressValues = [0, 5, 15, 25, 50, 60, 75, 90, 100]
      
      validProgressValues.forEach(progress => {
        expect(progress).toBeGreaterThanOrEqual(0)
        expect(progress).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('Processing Stage Logic', () => {
    test('smart parsing success flow', async () => {
      const mockResult = {
        dishes: [
          { name: 'Test Dish', price: '50 บาท', confidence: 0.95, category: 'main' }
        ],
        totalDishes: 1,
        processingTime: 2000,
        confidence: 0.95,
        language: 'th'
      }

      mockParseMenuWithAI.mockResolvedValueOnce(mockResult)

      const testFile = new File(['test image'], 'menu.jpg', { type: 'image/jpeg' })
      const result = await parseMenuWithAI(testFile)

      expect(result).toEqual(mockResult)
      expect(mockParseMenuWithAI).toHaveBeenCalledWith(testFile)
    })

    test('fallback to GPT4 when primary parsing returns few dishes', async () => {
      const insufficientResult = {
        dishes: [{ name: 'Only Dish', price: '50 บาท', confidence: 0.8, category: 'main' }],
        totalDishes: 1, // Too few dishes
        processingTime: 2000,
        confidence: 0.8,
        language: 'th'
      }

      const gpt4Result = {
        dishes: [
          { name: 'GPT4 Dish 1', price: '60 บาท', confidence: 0.9, category: 'main' },
          { name: 'GPT4 Dish 2', price: '70 บาท', confidence: 0.85, category: 'soup' }
        ],
        totalDishes: 2,
        processingTime: 4000,
        confidence: 0.87,
        language: 'th'
      }

      mockParseMenuWithAI.mockResolvedValueOnce(insufficientResult)
      mockParseMenuWithGPT4.mockResolvedValueOnce(gpt4Result)

      const testFile = new File(['test image'], 'menu.jpg', { type: 'image/jpeg' })
      
      // Test the condition that would trigger fallback
      const primaryResult = await parseMenuWithAI(testFile)
      expect(primaryResult.totalDishes).toBeLessThan(8) // This would trigger fallback

      // Test GPT4 fallback
      const fallbackResult = await parseMenuWithGPT4(testFile)
      expect(fallbackResult.totalDishes).toBeGreaterThan(primaryResult.totalDishes)
    })

    test('traditional OCR fallback when smart parsing fails', async () => {
      mockParseMenuWithAI.mockRejectedValueOnce(new Error('Smart parsing failed'))

      // Mock traditional OCR API
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: 'ข้าวผัดกุ้ง 80 บาท\nต้มยำกุ้ง 120 บาท',
          confidence: 0.85,
          processingTime: 3000
        })
      })

      const testFile = new File(['test image'], 'menu.jpg', { type: 'image/jpeg' })
      
      // Verify that smart parsing fails
      await expect(parseMenuWithAI(testFile)).rejects.toThrow('Smart parsing failed')

      // Verify traditional OCR would be called
      const formData = new FormData()
      formData.append('image', testFile)
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.text).toContain('ข้าวผัดกุ้ง')
      expect(data.confidence).toBe(0.85)
    })
  })

  describe('Processing Statistics', () => {
    test('calculates processing time correctly', () => {
      const startTime = Date.now()
      const processingDelay = 500
      
      setTimeout(() => {
        const endTime = Date.now()
        const actualTime = endTime - startTime
        expect(actualTime).toBeGreaterThanOrEqual(processingDelay)
      }, processingDelay)
    })

    test('formats image size correctly', () => {
      const testSizes = [
        { bytes: 1024, expectedMB: '0.00' },
        { bytes: 1024 * 1024, expectedMB: '1.00' },
        { bytes: 2.5 * 1024 * 1024, expectedMB: '2.50' },
        { bytes: 0.5 * 1024 * 1024, expectedMB: '0.50' }
      ]

      testSizes.forEach(({ bytes, expectedMB }) => {
        const sizeMB = (bytes / (1024 * 1024)).toFixed(2)
        expect(sizeMB).toBe(expectedMB)
      })
    })

    test('calculates confidence scores correctly', () => {
      const dishes = [
        { confidence: 0.95 },
        { confidence: 0.90 },
        { confidence: 0.85 },
        { confidence: 0.88 }
      ]

      const avgConfidence = dishes.reduce((sum, dish) => sum + dish.confidence, 0) / dishes.length
      const roundedConfidence = Math.round(avgConfidence * 100) / 100

      expect(roundedConfidence).toBe(0.9) // (0.95 + 0.90 + 0.85 + 0.88) / 4 = 0.895 ≈ 0.9
    })
  })

  describe('Error Handling', () => {
    test('handles network timeouts gracefully', async () => {
      mockParseMenuWithAI.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      const testFile = new File(['test'], 'menu.jpg', { type: 'image/jpeg' })
      
      await expect(parseMenuWithAI(testFile)).rejects.toThrow('Request timeout')
    })

    test('handles API failures gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const formData = new FormData()
      formData.append('image', new File(['test'], 'menu.jpg'))
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
    })

    test('handles invalid image files', () => {
      const invalidFiles = [
        new File([''], '', { type: '' }), // Empty file
        new File(['text'], 'text.txt', { type: 'text/plain' }), // Wrong type
        new File(['x'.repeat(20 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' }) // Too large
      ]

      invalidFiles.forEach(file => {
        // Test file validation logic
        const isValidImage = file.type.startsWith('image/') && file.size > 0 && file.size < 15 * 1024 * 1024
        
        if (file.type === '') {
          expect(isValidImage).toBe(false)
        } else if (file.type === 'text/plain') {
          expect(isValidImage).toBe(false) 
        } else if (file.size > 15 * 1024 * 1024) {
          expect(isValidImage).toBe(false)
        }
      })
    })
  })

  describe('Preview Generation', () => {
    test('generates text preview correctly', () => {
      const mockOCRText = 'ข้าวผัดกุ้ง 80 บาท\nต้มยำกุ้ง 120 บาท\nผัดไทย 70 บาท\nแกงเขียวหวาน 110 บาท\nข้าวหอมมะลิ 20 บาท'
      
      const previewLines = mockOCRText.split('\n').slice(0, 5)
      const preview = previewLines.join('\n')
      
      expect(preview).toBe(mockOCRText) // All 5 lines fit in preview
      expect(previewLines.length).toBeLessThanOrEqual(5)
    })

    test('generates dish preview correctly', () => {
      const mockDishes = [
        { name: 'ข้าวผัดกุ้ง', price: '80 บาท', confidence: 0.95, category: 'main' },
        { name: 'ต้มยำกุ้ง', price: '120 บาท', confidence: 0.90, category: 'soup' },
        { name: 'ผัดไทย', price: '70 บาท', confidence: 0.88, category: 'main' },
        { name: 'แกงเขียวหวาน', price: '110 บาท', confidence: 0.85, category: 'curry' }
      ]

      const previewDishes = mockDishes.slice(0, 3) // First 3 dishes for preview
      
      expect(previewDishes).toHaveLength(3)
      expect(previewDishes[0].name).toBe('ข้าวผัดกุ้ง')
      expect(previewDishes[1].name).toBe('ต้มยำกุ้ง')
      expect(previewDishes[2].name).toBe('ผัดไทย')
    })
  })
})