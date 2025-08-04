# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MenuMate is a Next.js 15 application that allows users to photograph restaurant menus and get instant translations with smart dish analysis. The app uses OCR (Google Cloud Vision) to extract text from menu images, translates the content, and provides structured dish information with ingredients, dietary classifications, and recommendations.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality

## Git Best Practices

- git commit often with short messages

## Architecture

### Core Application Structure

The app follows a single-page application pattern with multiple screens managed by state:
- **Welcome Screen**: Landing page with app introduction
- **Camera Screen**: Photo capture interface with file upload
- **Processing Screen**: OCR processing with loading states
- **Results Screen**: Display extracted dishes with translation options
- **Translation Screen**: Side-by-side original/translated text comparison
- **Dish Detail Screen**: Individual dish information view
- **Filters Screen**: Dietary preferences and search filters
- **Share Screen**: QR code generation for menu sharing

### Data Flow Architecture

1. **Image Processing Pipeline**:
   - `PhotoUpload` component handles image capture/upload
   - `imagePreprocessor.ts` analyzes and enhances image quality
   - `/api/ocr/route.ts` processes images via Google Cloud Vision API
   - Extracted text is parsed into structured dish data

2. **Translation System**:
   - `languages.ts` provides language detection and supported languages
   - `translationCache.ts` caches translations for performance
   - `/api/translate/route.ts` handles translation requests
   - Results are merged with original OCR data

3. **Dish Analysis Engine**:
   - `dishParser.ts` contains logic for parsing menu text into structured dishes
   - `utils/dishImage.ts` provides dish image matching
   - Analysis includes price extraction, ingredient detection, dietary classification

### Key Components

- **CartContext**: React context for shopping cart state management
- **DishCard**: Reusable component for displaying dish information
- **QRCodeSection**: Generates QR codes for menu sharing
- **CartButton**: Floating action button for cart access

### State Management

The main application state is managed in `app/page.tsx` using React hooks:
- `currentScreen`: Controls which screen is displayed
- `parsedDishes`: Array of structured dish data from OCR
- `ocrText` & `translatedText`: Raw and translated menu text
- `menuImage`: Uploaded image file
- Shopping cart state is managed via React Context in `CartContext.tsx`

### API Routes

- `/api/ocr` - Google Cloud Vision OCR processing
- `/api/translate` - Text translation service
- Both support mock mode via environment variables for development

### Type System

- `types/menu.ts` defines the `ParsedDish` interface
- `utils/dishParser.ts` contains `DishAnalysis` interface
- TypeScript strict mode enabled with comprehensive type checking

## Environment Variables

The app uses environment variables for external services:
- `GOOGLE_CLOUD_VISION_API_KEY` - Google Cloud Vision API key
- `USE_MOCK_OCR` - Set to "true" to use mock OCR responses for development

## Styling

- Uses Tailwind CSS v4 with custom configuration
- Responsive design optimized for mobile-first experience
- Custom UI components in `components/ui/` using Radix UI primitives
- Orange/red gradient theme with modern glassmorphism effects

## Key Features

- **Smart OCR Processing**: Handles various menu formats and languages
- **Intelligent Price Parsing**: Extracts prices in multiple currencies and formats
- **Dietary Classification**: Automatically detects vegetarian, vegan, gluten-free options
- **Spice Level Detection**: Analyzes dish names for spice level indicators
- **Translation Caching**: Optimizes performance with client-side translation cache
- **QR Code Sharing**: Generates shareable QR codes for menu data
- **Shopping Cart**: Add dishes to cart with quantity management