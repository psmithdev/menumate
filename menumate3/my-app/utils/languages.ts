export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: "ltr" | "rtl";
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    direction: "ltr",
  },
  {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    flag: "🇨🇳",
    direction: "ltr",
  },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭", direction: "ltr" },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    direction: "ltr",
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    direction: "ltr",
  },
  {
    code: "vi",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    flag: "🇻🇳",
    direction: "ltr",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    direction: "ltr",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    direction: "ltr",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    direction: "ltr",
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    direction: "ltr",
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇵🇹",
    direction: "ltr",
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    direction: "ltr",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    direction: "rtl",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    direction: "ltr",
  },
  {
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    flag: "🇹🇷",
    direction: "ltr",
  },
];

// Language detection patterns
const LANGUAGE_PATTERNS = {
  chinese: /[\u4e00-\u9fff]/,
  thai: /[\u0e00-\u0e7f]/,
  japanese: /[\u3040-\u309f\u30a0-\u30ff]/,
  korean: /[\uac00-\ud7af]/,
  arabic: /[\u0600-\u06ff]/,
  hindi: /[\u0900-\u097f]/,
  russian: /[\u0400-\u04ff]/,
  greek: /[\u0370-\u03ff]/,
  hebrew: /[\u0590-\u05ff]/,
};

export function detectLanguage(text: string): string {
  const normalizedText = text.toLowerCase();

  // Check for specific language patterns
  if (LANGUAGE_PATTERNS.chinese.test(text)) {
    return "zh";
  }
  if (LANGUAGE_PATTERNS.thai.test(text)) {
    return "th";
  }
  if (LANGUAGE_PATTERNS.japanese.test(text)) {
    return "ja";
  }
  if (LANGUAGE_PATTERNS.korean.test(text)) {
    return "ko";
  }
  if (LANGUAGE_PATTERNS.arabic.test(text)) {
    return "ar";
  }
  if (LANGUAGE_PATTERNS.hindi.test(text)) {
    return "hi";
  }
  if (LANGUAGE_PATTERNS.russian.test(text)) {
    return "ru";
  }

  // Check for common words/phrases
  const languageIndicators = {
    thai: ["สวัสดี", "ขอบคุณ", "อร่อย", "อาหาร", "ร้านอาหาร"],
    vietnamese: ["xin chào", "cảm ơn", "ngon", "món ăn", "nhà hàng"],
    spanish: ["hola", "gracias", "delicioso", "comida", "restaurante"],
    french: ["bonjour", "merci", "délicieux", "nourriture", "restaurant"],
    german: ["hallo", "danke", "lecker", "essen", "restaurant"],
    italian: ["ciao", "grazie", "delizioso", "cibo", "ristorante"],
    portuguese: ["olá", "obrigado", "delicioso", "comida", "restaurante"],
    turkish: ["merhaba", "teşekkürler", "lezzetli", "yemek", "restoran"],
  };

  for (const [lang, indicators] of Object.entries(languageIndicators)) {
    if (indicators.some((indicator) => normalizedText.includes(indicator))) {
      return lang;
    }
  }

  // Default to English if no pattern matches
  return "en";
}

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
}

export function getLanguageName(code: string): string {
  const language = getLanguageByCode(code);
  return language ? language.name : "Unknown";
}

export function getNativeLanguageName(code: string): string {
  const language = getLanguageByCode(code);
  return language ? language.nativeName : "Unknown";
}

// Common menu terms in different languages
export const MENU_TERMS = {
  en: {
    menu: "menu",
    appetizer: "appetizer",
    main: "main",
    dessert: "dessert",
    drink: "drink",
    price: "price",
    spicy: "spicy",
    vegetarian: "vegetarian",
  },
  zh: {
    menu: "菜单",
    appetizer: "开胃菜",
    main: "主菜",
    dessert: "甜点",
    drink: "饮料",
    price: "价格",
    spicy: "辣",
    vegetarian: "素食",
  },
  th: {
    menu: "เมนู",
    appetizer: "อาหารเรียกน้ำย่อย",
    main: "อาหารจานหลัก",
    dessert: "ของหวาน",
    drink: "เครื่องดื่ม",
    price: "ราคา",
    spicy: "เผ็ด",
    vegetarian: "มังสวิรัติ",
  },
  ja: {
    menu: "メニュー",
    appetizer: "前菜",
    main: "メインディッシュ",
    dessert: "デザート",
    drink: "ドリンク",
    price: "価格",
    spicy: "辛い",
    vegetarian: "ベジタリアン",
  },
  ko: {
    menu: "메뉴",
    appetizer: "전채",
    main: "메인요리",
    dessert: "디저트",
    drink: "음료",
    price: "가격",
    spicy: "매운",
    vegetarian: "채식",
  },
};

export function getMenuTerms(languageCode: string): Record<string, string> {
  return MENU_TERMS[languageCode as keyof typeof MENU_TERMS] || MENU_TERMS.en;
}
