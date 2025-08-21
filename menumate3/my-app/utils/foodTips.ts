export const foodTips = [
  // Thai cuisine tips
  "Tom Yum is Thailand's national soup, known for its hot and sour flavors.",
  "Pad Thai was invented in the 1930s as street food to promote national identity.",
  "Sticky rice is eaten more in northern Thailand than bread.",
  "Som tam (papaya salad) was originally from Laos but became a Thai staple.",
  "Thai basil is different from sweet basil and has a distinct anise flavor.",
  
  // Japanese cuisine tips
  "Sushi originally started as a way to preserve fish in fermented rice.",
  "Ramen noodles were actually invented in China but perfected in Japan.",
  "Wasabi is traditionally grated fresh from the root for maximum heat.",
  "Miso soup is traditionally served at the end of a meal, not the beginning.",
  "Tempura was introduced to Japan by Portuguese missionaries in the 16th century.",
  
  // Italian cuisine tips
  "Authentic carbonara never contains cream - just eggs, cheese, and guanciale.",
  "Pizza Margherita was created in 1889 to honor Queen Margherita of Italy.",
  "Cappuccino is traditionally only drunk in the morning in Italy.",
  "Parmigiano-Reggiano cheese ages for at least 12 months, sometimes up to 36.",
  "The word 'pasta' comes from the Greek word 'pastos', meaning barley porridge.",
  
  // Chinese cuisine tips
  "Fortune cookies were actually invented in California, not China.",
  "Hot pot dining dates back over 1,000 years to the Jin Dynasty.",
  "Dim sum means 'touch the heart' in Cantonese.",
  "Peking duck preparation takes 3 days from start to finish.",
  "Tea was discovered accidentally by Emperor Shen Nung in 2737 BCE.",
  
  // Indian cuisine tips
  "Curry powder isn't used in traditional Indian cooking - it's a British invention.",
  "Naan bread is traditionally cooked in a tandoor oven at 900°F.",
  "Turmeric has been used in Indian cooking for over 4,000 years.",
  "Biryani has over 26 different regional varieties across India.",
  "Chai literally means 'tea' in Hindi, so 'chai tea' is redundant.",
  
  // Mexican cuisine tips
  "Chocolate was first consumed as a bitter drink by the Aztecs.",
  "Avocados were considered an aphrodisiac by the Aztecs.",
  "Corn tortillas are naturally gluten-free and have been made for 3,000 years.",
  "Mole sauce can contain over 20 different ingredients.",
  "Tequila can only be made in specific regions of Mexico.",
  
  // French cuisine tips
  "Croissants were actually invented in Austria, not France.",
  "French fries might have originated in Belgium, not France.",
  "Champagne can only be called champagne if it's from the Champagne region.",
  "Escargot has been eaten in France since Roman times.",
  "Baguettes were legally required to contain only flour, water, salt, and yeast.",
  
  // General cooking tips
  "Salt enhances sweetness and suppresses bitterness in food.",
  "Umami is considered the fifth taste alongside sweet, sour, bitter, and salty.",
  "Mise en place (everything in its place) is a fundamental cooking principle.",
  "Proteins should rest after cooking to redistribute juices.",
  "Garlic releases different flavors depending on how it's cut.",
  
  // Fun food facts
  "Honey never spoils - archaeologists have found edible honey in ancient tombs.",
  "Bananas are berries, but strawberries aren't.",
  "A tomato is technically a fruit, not a vegetable.",
  "Carrots were originally purple before Dutch farmers bred orange ones.",
  "Vanilla is the second most expensive spice after saffron.",
  
  // Restaurant culture
  "The word 'restaurant' comes from the French verb 'restaurer' (to restore).",
  "Tipping culture varies dramatically around the world.",
  "Many Asian cultures consider it rude to finish all food on your plate.",
  "The chef's table originated as a way for chefs to interact with guests.",
  "Food plating is considered an art form called 'gastronomy'."
];

export function getRandomFoodTip(): string {
  return foodTips[Math.floor(Math.random() * foodTips.length)];
}

export function getFoodTipByInterval(intervalMs: number = 3000): string {
  const index = Math.floor(Date.now() / intervalMs) % foodTips.length;
  return foodTips[index];
}