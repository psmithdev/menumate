// Comprehensive ingredient database for Chinese and Thai cuisine
// Structured by category and language for accurate dietary analysis

export interface IngredientDatabase {
  meat: {
    english: string[];
    chinese: string[];
    thai: string[];
  };
  vegetables: {
    english: string[];
    chinese: string[];
    thai: string[];
  };
  dairy: {
    english: string[];
    chinese: string[];
    thai: string[];
  };
  nuts: {
    english: string[];
    chinese: string[];
    thai: string[];
  };
  gluten: {
    english: string[];
    chinese: string[];
    thai: string[];
  };
  spices: {
    mild: string[];
    medium: string[];
    hot: string[];
    very_hot: string[];
  };
}

export const INGREDIENT_DB: IngredientDatabase = {
  meat: {
    english: [
      // Poultry
      "chicken", "duck", "goose", "turkey", "quail",
      // Pork
      "pork", "bacon", "ham", "sausage", "chorizo",
      // Beef
      "beef", "steak", "ground beef", "brisket", "ribs",
      // Lamb/Mutton
      "lamb", "mutton",
      // Seafood
      "fish", "salmon", "tuna", "cod", "shrimp", "prawn", "crab", "lobster", 
      "scallop", "oyster", "mussel", "clam", "squid", "octopus", "eel",
      // Other
      "meat", "burger", "meatball"
    ],
    chinese: [
      // Basic meat terms
      "肉", "荤", 
      // Poultry
      "鸡", "鸡肉", "鸭", "鸭肉", "鹅", "鹅肉", "火鸡",
      // Pork
      "猪", "猪肉", "五花肉", "里脊", "排骨", "腊肉", "火腿", "香肠",
      // Beef
      "牛", "牛肉", "牛排", "牛腩", "牛筋",
      // Lamb/Mutton
      "羊", "羊肉", "羔羊",
      // Seafood
      "鱼", "鲑鱼", "金枪鱼", "鳕鱼", "虾", "蟹", "螃蟹", "龙虾", 
      "扇贝", "牡蛎", "蛤蜊", "鱿鱼", "章鱼", "鳗鱼", "海参", "鲍鱼",
      // Organ meats
      "肝", "肾", "心", "肠", "大肠", "猪肝", "鸡肝",
      // Processed
      "肉丸", "肉饼", "腊肠"
    ],
    thai: [
      // Basic meat terms
      "เนื้อ", "เนื้อสัตว์",
      // Poultry
      "ไก่", "เป็ด", "ห่าน",
      // Pork
      "หมู", "เนื้อหมู", "แฮม", "ไส้กรอก",
      // Beef
      "เนื้อวัว", "สเต็ก",
      // Seafood
      "ปลา", "กุ้ง", "ปู", "หอย", "ปลาหมึก", "ปลาไหล", "หอยเชลล์"
    ]
  },

  vegetables: {
    english: [
      "vegetable", "veggie", "tofu", "tempeh", "seitan",
      "eggplant", "aubergine", "tomato", "onion", "garlic", "ginger",
      "mushroom", "shiitake", "bell pepper", "chili", "carrot", "potato",
      "cabbage", "bok choy", "spinach", "lettuce", "cucumber", "zucchini",
      "broccoli", "cauliflower", "bean sprout", "snow pea", "green bean",
      "corn", "celery", "radish", "turnip", "beet", "asparagus"
    ],
    chinese: [
      "菜", "蔬菜", "素", "素食", "豆腐", "面筋",
      "茄子", "西红柿", "番茄", "洋葱", "大蒜", "蒜", "生姜", "姜",
      "蘑菇", "菇", "香菇", "金针菇", "平菇", "青椒", "辣椒", "胡萝卜", "土豆", "马铃薯",
      "白菜", "大白菜", "小白菜", "青菜", "菠菜", "生菜", "黄瓜", "西葫芦",
      "西兰花", "花椰菜", "豆芽", "豌豆", "四季豆", "玉米", "芹菜", "萝卜", "芦笋",
      "韭菜", "葱", "小葱", "大葱", "莲藕", "冬瓜", "丝瓜", "苦瓜"
    ],
    thai: [
      "ผัก", "เต้าหู้",
      "มะเขือ", "มะเขือเทศ", "หอม", "กระเทียม", "ขิง",
      "เห็ด", "พริก", "แครอท", "มันฝรั่ง", "กะหล่ำ", "ผักโขม", 
      "แตงกวา", "ข้าวโพด", "ขึ้นฉ่าย", "หัวไชเท้า", "ถั่วงอก"
    ]
  },

  dairy: {
    english: [
      "milk", "dairy", "cheese", "butter", "cream", "yogurt", "lactose",
      "whey", "casein", "mozzarella", "parmesan", "cheddar", "cottage cheese",
      "sour cream", "ice cream", "ghee", "buttermilk", "heavy cream"
    ],
    chinese: [
      "奶", "牛奶", "乳", "乳制品", "奶酪", "芝士", "黄油", "奶油",
      "酸奶", "乳糖", "马苏里拉", "帕尔马", "切达", "酸奶油", "冰淇淋"
    ],
    thai: [
      "นม", "นมวัว", "เนย", "ครีม", "โยเกิร์ต", "ชีส", "ไอศครีม"
    ]
  },

  nuts: {
    english: [
      "nut", "nuts", "peanut", "almond", "walnut", "cashew", "pecan",
      "pistachio", "hazelnut", "macadamia", "pine nut", "brazil nut",
      "chestnut", "sesame", "sunflower seed", "pumpkin seed"
    ],
    chinese: [
      "坚果", "果仁", "花生", "杏仁", "核桃", "腰果", "胡桃",
      "开心果", "榛子", "夏威夷果", "松子", "巴西坚果", "栗子",
      "芝麻", "瓜子", "南瓜子"
    ],
    thai: [
      "ถั่ว", "ถั่วลิสง", "อัลมอนด์", "วอลนัท", "แคชชิว",
      "พิสตาชิโอ", "เฮเซลนัท", "งา"
    ]
  },

  gluten: {
    english: [
      "wheat", "flour", "bread", "noodles", "pasta", "dumpling", "ramen",
      "udon", "soba", "gluten", "barley", "rye", "malt", "seitan",
      "tempura", "breaded", "batter", "roll", "bun", "croissant"
    ],
    chinese: [
      "小麦", "面粉", "面", "面条", "面包", "包子", "馒头", "饺子", "馄饨",
      "麸质", "大麦", "黑麦", "麦芽", "面筋", "天妇罗", "裹粉", "面糊",
      "拉面", "乌冬面", "荞麦面", "意面", "通心粉"
    ],
    thai: [
      "แป้งสาลี", "แป้ง", "ขนมปัง", "เส้น", "เส้นหมี่", "เกี๊ยว",
      "บะหมี่", "เทมปุระ", "โครง", "แป้งทอด"
    ]
  },

  spices: {
    mild: [
      "mild", "sweet", "sour", "light", "gentle", "no spice", "non-spicy",
      "子供", "子ども", "温和", "清淡", "不辣", "微甜"
    ],
    medium: [
      "medium", "moderate", "balanced", "traditional", 
      "少し辛い", "微辣", "小辣", "中等", "适中"
    ],
    hot: [
      "spicy", "hot", "fiery", "burning", "chili", "pepper", "curry",
      "szechuan", "sichuan", "辛い", "中辣", "辣", "川菜", "麻辣",
      "jalapeño", "habanero", "thai chili", "bird's eye", "sambal", "gochujang"
    ],
    very_hot: [
      "extra spicy", "very hot", "burning hot", "nuclear", "volcano",
      "ghost pepper", "carolina reaper", "scotch bonnet", 
      "超辛い", "大辣", "火辣", "变态辣", "死神辣椒"
    ]
  }
};

// Helper functions for ingredient checking
export function getAllMeatIndicators(): string[] {
  return [
    ...INGREDIENT_DB.meat.english,
    ...INGREDIENT_DB.meat.chinese,
    ...INGREDIENT_DB.meat.thai
  ];
}

export function getAllVegetableIndicators(): string[] {
  return [
    ...INGREDIENT_DB.vegetables.english,
    ...INGREDIENT_DB.vegetables.chinese,
    ...INGREDIENT_DB.vegetables.thai
  ];
}

export function getAllDairyIndicators(): string[] {
  return [
    ...INGREDIENT_DB.dairy.english,
    ...INGREDIENT_DB.dairy.chinese,
    ...INGREDIENT_DB.dairy.thai
  ];
}

export function getAllNutIndicators(): string[] {
  return [
    ...INGREDIENT_DB.nuts.english,
    ...INGREDIENT_DB.nuts.chinese,
    ...INGREDIENT_DB.nuts.thai
  ];
}

export function getAllGlutenIndicators(): string[] {
  return [
    ...INGREDIENT_DB.gluten.english,
    ...INGREDIENT_DB.gluten.chinese,
    ...INGREDIENT_DB.gluten.thai
  ];
}