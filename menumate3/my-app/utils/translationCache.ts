interface CachedTranslation {
  originalText: string;
  translatedText: string;
  targetLanguage: string;
  timestamp: number;
  confidence: number;
}

const CACHE_KEY = "menumate_translations";
const CACHE_EXPIRY_DAYS = 30; // Cache for 30 days

export class TranslationCache {
  private static getCache(): CachedTranslation[] {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.warn("Failed to load translation cache:", error);
      return [];
    }
  }

  private static setCache(cache: CachedTranslation[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn("Failed to save translation cache:", error);
    }
  }

  private static cleanupExpired(): void {
    const cache = this.getCache();
    const now = Date.now();
    const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    const validCache = cache.filter((item) => now - item.timestamp < expiryMs);

    if (validCache.length !== cache.length) {
      this.setCache(validCache);
    }
  }

  static get(originalText: string, targetLanguage: string): string | null {
    this.cleanupExpired();

    const cache = this.getCache();
    const cached = cache.find(
      (item) =>
        item.originalText === originalText &&
        item.targetLanguage === targetLanguage
    );

    return cached ? cached.translatedText : null;
  }

  static set(
    originalText: string,
    translatedText: string,
    targetLanguage: string,
    confidence: number = 1.0
  ): void {
    const cache = this.getCache();

    // Remove existing entry if it exists
    const filteredCache = cache.filter(
      (item) =>
        !(
          item.originalText === originalText &&
          item.targetLanguage === targetLanguage
        )
    );

    // Add new entry
    const newEntry: CachedTranslation = {
      originalText,
      translatedText,
      targetLanguage,
      timestamp: Date.now(),
      confidence,
    };

    filteredCache.push(newEntry);
    this.setCache(filteredCache);
  }

  static clear(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.warn("Failed to clear translation cache:", error);
    }
  }

  static getStats(): { total: number; size: number } {
    const cache = this.getCache();
    const size = new Blob([JSON.stringify(cache)]).size;

    return {
      total: cache.length,
      size: size,
    };
  }
}

// Utility function to check if text is similar (for fuzzy matching)
export function isSimilarText(
  text1: string,
  text2: string,
  threshold: number = 0.8
): boolean {
  const normalize = (text: string) =>
    text.toLowerCase().replace(/\s+/g, " ").trim();
  const normalized1 = normalize(text1);
  const normalized2 = normalize(text2);

  if (normalized1 === normalized2) return true;

  // Simple similarity check (can be enhanced with more sophisticated algorithms)
  const words1 = normalized1.split(" ");
  const words2 = normalized2.split(" ");

  const commonWords = words1.filter((word) => words2.includes(word));
  const similarity =
    commonWords.length / Math.max(words1.length, words2.length);

  return similarity >= threshold;
}

// Enhanced get function with fuzzy matching
export function getCachedTranslation(
  originalText: string,
  targetLanguage: string,
  useFuzzyMatch: boolean = true
): string | null {
  const exactMatch = TranslationCache.get(originalText, targetLanguage);
  if (exactMatch) return exactMatch;

  if (useFuzzyMatch) {
    const cache = TranslationCache["getCache"]();
    const similar = cache.find(
      (item) =>
        item.targetLanguage === targetLanguage &&
        isSimilarText(item.originalText, originalText)
    );

    return similar ? similar.translatedText : null;
  }

  return null;
}
