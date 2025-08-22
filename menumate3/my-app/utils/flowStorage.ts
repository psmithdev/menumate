// Optimized flow data storage utilities
export class FlowStorage {
  private static cache = new Map<string, any>();
  
  // Batch read operations
  static getFlowData() {
    if (typeof window === 'undefined') return {};
    
    try {
      return {
        menuImage: sessionStorage.getItem("menuImage"),
        parsedDishes: this.getCached("parsedDishes", () => 
          sessionStorage.getItem("parsedDishes")
        ),
        ocrText: sessionStorage.getItem("ocrText"),
        translatedText: sessionStorage.getItem("translatedText"),
        detectedLanguage: sessionStorage.getItem("detectedLanguage") || "en",
        selectedDish: this.getCached("selectedDish", () => 
          sessionStorage.getItem("selectedDish")
        ),
        currentFilters: this.getCached("currentFilters", () => 
          sessionStorage.getItem("currentFilters")
        ),
      };
    } catch (error) {
      console.warn("Error reading flow data:", error);
      return {};
    }
  }
  
  // Batch write operations with requestAnimationFrame
  static setFlowData(data: Record<string, any>) {
    if (typeof window === 'undefined') return;
    
    requestAnimationFrame(() => {
      try {
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            sessionStorage.setItem(key, stringValue);
            this.cache.set(key, value);
          }
        });
      } catch (error) {
        console.warn("Error writing flow data:", error);
      }
    });
  }
  
  // Optimized individual setters
  static setMenuImage(imageData: string) {
    this.setFlowData({ menuImage: imageData });
  }
  
  static setParsedDishes(dishes: any[]) {
    this.setFlowData({ parsedDishes: dishes });
    this.cache.set("parsedDishes", dishes);
  }
  
  static setSelectedDish(dish: any) {
    this.setFlowData({ selectedDish: dish });
    this.cache.set("selectedDish", dish);
  }
  
  static setOCRData(ocrText: string, detectedLanguage: string = "en") {
    this.setFlowData({ ocrText, detectedLanguage });
  }
  
  static setTranslatedText(translatedText: string) {
    this.setFlowData({ translatedText });
  }
  
  // Cached getters for frequently accessed data
  private static getCached(key: string, fetcher: () => string | null) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const value = fetcher();
    if (value) {
      try {
        const parsed = JSON.parse(value);
        this.cache.set(key, parsed);
        return parsed;
      } catch {
        this.cache.set(key, value);
        return value;
      }
    }
    
    return null;
  }
  
  static getParsedDishes() {
    return this.getCached("parsedDishes", () => 
      sessionStorage.getItem("parsedDishes")
    ) || [];
  }
  
  static getSelectedDish() {
    return this.getCached("selectedDish", () => 
      sessionStorage.getItem("selectedDish")
    );
  }
  
  // Clear cache when needed
  static clearCache() {
    this.cache.clear();
  }
  
  // Preload data for faster transitions
  static preloadData() {
    if (typeof window === 'undefined') return;
    
    requestIdleCallback(() => {
      this.getFlowData();
    });
  }
}