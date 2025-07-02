// Menu Mate App JS

document.addEventListener("DOMContentLoaded", () => {
  // App logic will go here
  console.log("Menu Mate app loaded");

  const fileInput = document.querySelector('#menu-upload input[type="file"]');
  const scanButton = document.querySelector("#menu-upload button");
  const menuUploadSection = document.getElementById("menu-upload");

  // Create a container for OCR results and feedback
  let ocrResultDiv = document.createElement("div");
  ocrResultDiv.id = "ocr-result";
  menuUploadSection.appendChild(ocrResultDiv);

  let selectedFile = null;

  fileInput.addEventListener("change", (e) => {
    selectedFile = e.target.files[0];
    scanButton.disabled = !selectedFile;
    ocrResultDiv.textContent = "";
  });

  scanButton.addEventListener("click", async () => {
    if (!selectedFile) return;
    ocrResultDiv.textContent = "Scanning...";
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(selectedFile, "tha+eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            ocrResultDiv.textContent = `Scanning... (${Math.round(
              m.progress * 100
            )}%)`;
          }
        },
      });
      const extractedText = text.trim();
      if (extractedText) {
        ocrResultDiv.innerHTML = `
          <h3>Extracted Text:</h3>
          <p>${extractedText}</p>
          <p>Translating...</p>
        `;
        // Translate the text (you'll need to add your API key)
        const translatedText = await translateText(extractedText);
        ocrResultDiv.innerHTML = `
          <h3>Extracted Text:</h3>
          <p>${extractedText}</p>
          <h3>Translated to English:</h3>
          <p>${translatedText}</p>
        `;
      } else {
        ocrResultDiv.textContent = "No text found.";
      }
    } catch (err) {
      ocrResultDiv.textContent = "Error: Could not read image.";
      console.error(err);
    }
  });

  // Translation function with Google Translate API
  async function translateText(text) {
    const apiKey = prompt("Enter your Google Translate API key:");
    if (!apiKey) {
      return "Translation skipped - no API key provided";
    }

    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: text,
            target: "en",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data.translations[0].translatedText;
    } catch (error) {
      console.error("Translation error:", error);
      return `Translation failed: ${error.message}`;
    }
  }

  // --- Demo Menu Data ---
  const menuItems = [
    {
      nameTH: "ผัดไทย",
      nameEN: "Pad Thai",
      calories: 400,
      protein: 15,
      spice: "Mild",
      vegetarian: false,
      halal: true,
      pork: false,
      sugar: true,
      fructose: false,
      price: 60,
    },
    {
      nameTH: "ส้มตำ",
      nameEN: "Som Tum (Papaya Salad)",
      calories: 180,
      protein: 3,
      spice: "Spicy",
      vegetarian: true,
      halal: true,
      pork: false,
      sugar: false,
      fructose: false,
      price: 40,
    },
    {
      nameTH: "ข้าวมันไก่",
      nameEN: "Khao Man Gai (Chicken Rice)",
      calories: 600,
      protein: 25,
      spice: "Mild",
      vegetarian: false,
      halal: true,
      pork: false,
      sugar: false,
      fructose: false,
      price: 50,
    },
    {
      nameTH: "หมูกรอบ",
      nameEN: "Crispy Pork",
      calories: 700,
      protein: 20,
      spice: "Mild",
      vegetarian: false,
      halal: false,
      pork: true,
      sugar: false,
      fructose: false,
      price: 70,
    },
    {
      nameTH: "ผัดผักรวม",
      nameEN: "Stir-fried Mixed Vegetables",
      calories: 250,
      protein: 6,
      spice: "Medium",
      vegetarian: true,
      halal: true,
      pork: false,
      sugar: false,
      fructose: false,
      price: 45,
    },
    {
      nameTH: "ชาเย็น",
      nameEN: "Thai Iced Tea",
      calories: 200,
      protein: 2,
      spice: "Mild",
      vegetarian: true,
      halal: true,
      pork: false,
      sugar: true,
      fructose: true,
      price: 25,
    },
  ];

  // --- Filter Reading ---
  function getFilters() {
    const spice = document.getElementById("filter-spice").value;
    const calories =
      parseInt(document.getElementById("filter-calories").value) || Infinity;
    const protein =
      parseInt(document.getElementById("filter-protein").value) || 0;
    const vegetarian = document.getElementById("filter-vegetarian").checked;
    const halal = document.getElementById("filter-halal").checked;
    const excludePork = document.getElementById("filter-exclude-pork").checked;
    const excludeSugar = document.getElementById(
      "filter-exclude-sugar"
    ).checked;
    const excludeFructose = document.getElementById(
      "filter-exclude-fructose"
    ).checked;
    const budget =
      parseInt(document.getElementById("budget-input").value) || Infinity;
    return {
      spice,
      calories,
      protein,
      vegetarian,
      halal,
      excludePork,
      excludeSugar,
      excludeFructose,
      budget,
    };
  }

  // --- Suggestion Logic ---
  function filterMenu(filters) {
    return menuItems.filter((item) => {
      if (filters.spice !== "Mild" && item.spice !== filters.spice)
        return false;
      if (item.calories > filters.calories) return false;
      if (item.protein < filters.protein) return false;
      if (filters.vegetarian && !item.vegetarian) return false;
      if (filters.halal && !item.halal) return false;
      if (filters.excludePork && item.pork) return false;
      if (filters.excludeSugar && item.sugar) return false;
      if (filters.excludeFructose && item.fructose) return false;
      if (item.price > filters.budget) return false;
      return true;
    });
  }

  function showSuggestions(items) {
    const resultsDiv = document.querySelector("#results .suggestion-list");
    if (!items.length) {
      resultsDiv.innerHTML = "<p>No matching dishes found.</p>";
      return;
    }
    resultsDiv.innerHTML = items
      .map(
        (item) =>
          `<div class="suggestion-item">
        <strong>${item.nameEN}</strong> (${item.nameTH})<br>
        Price: ${item.price} Baht<br>
        Calories: ${item.calories}, Protein: ${item.protein}g, Spice: ${
            item.spice
          }<br>
        ${item.vegetarian ? "Vegetarian" : ""} ${item.halal ? "Halal" : ""}
      </div>`
      )
      .join("");
  }

  // --- Helper: Get random combinations ---
  function getRandomCombinations(arr, comboSize, maxBudget, maxResults = 3) {
    // Generate all combinations of comboSize
    function* combinations(array, size, start = 0, initialCombo = []) {
      if (initialCombo.length === size) {
        yield initialCombo;
        return;
      }
      for (let i = start; i < array.length; i++) {
        yield* combinations(
          array,
          size,
          i + 1,
          initialCombo.concat([array[i]])
        );
      }
    }
    // Filter combinations by budget
    const validCombos = [];
    for (const combo of combinations(arr, comboSize)) {
      const total = combo.reduce((sum, item) => sum + item.price, 0);
      if (total <= maxBudget) {
        validCombos.push({ items: combo, total });
      }
    }
    // Shuffle and pick up to maxResults
    for (let i = validCombos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validCombos[i], validCombos[j]] = [validCombos[j], validCombos[i]];
    }
    return validCombos.slice(0, maxResults);
  }

  // --- Show combinations in results ---
  function showComboSuggestions(combos) {
    const resultsDiv = document.querySelector("#results .suggestion-list");
    if (!combos.length) {
      resultsDiv.innerHTML =
        "<p>No combinations of dishes fit your budget and filters.</p>";
      return;
    }
    resultsDiv.innerHTML = combos
      .map(
        (combo) =>
          `<div class="suggestion-combo">
        ${combo.items
          .map(
            (item) =>
              `<strong>${item.nameEN}</strong> (${item.nameTH}) - ${item.price} Baht`
          )
          .join("<br>")}
        <br><strong>Total: ${combo.total} Baht</strong>
      </div>`
      )
      .join("<hr>");
  }

  // --- Button Event Listeners (refined for budget combos) ---
  document.getElementById("btn-what-to-eat").addEventListener("click", () => {
    const filters = getFilters();
    const filtered = filterMenu(filters);
    if (filtered.length < 2) {
      showSuggestions(filtered);
      return;
    }
    const combos2 = getRandomCombinations(filtered, 2, filters.budget);
    const combos3 = getRandomCombinations(filtered, 3, filters.budget);
    showComboSuggestions([...combos2, ...combos3]);
  });
  document.getElementById("btn-vegetarian").addEventListener("click", () => {
    const filters = getFilters();
    filters.vegetarian = true;
    const filtered = filterMenu(filters);
    if (filtered.length < 2) {
      showSuggestions(filtered);
      return;
    }
    const combos2 = getRandomCombinations(filtered, 2, filters.budget);
    const combos3 = getRandomCombinations(filtered, 3, filters.budget);
    showComboSuggestions([...combos2, ...combos3]);
  });
  document.getElementById("btn-bodybuilder").addEventListener("click", () => {
    const filters = getFilters();
    filters.protein = Math.max(filters.protein, 20);
    const filtered = filterMenu(filters);
    if (filtered.length < 2) {
      showSuggestions(filtered);
      return;
    }
    const combos2 = getRandomCombinations(filtered, 2, filters.budget);
    const combos3 = getRandomCombinations(filtered, 3, filters.budget);
    showComboSuggestions([...combos2, ...combos3]);
  });
  document.getElementById("btn-spicy").addEventListener("click", () => {
    const filters = getFilters();
    filters.spice = "Spicy";
    const filtered = filterMenu(filters);
    if (filtered.length < 2) {
      showSuggestions(filtered);
      return;
    }
    const combos2 = getRandomCombinations(filtered, 2, filters.budget);
    const combos3 = getRandomCombinations(filtered, 3, filters.budget);
    showComboSuggestions([...combos2, ...combos3]);
  });
  document.getElementById("btn-surprise").addEventListener("click", () => {
    const filters = getFilters();
    const filtered = filterMenu(filters);
    if (filtered.length < 2) {
      showSuggestions(filtered);
      return;
    }
    const combos2 = getRandomCombinations(filtered, 2, filters.budget, 1);
    const combos3 = getRandomCombinations(filtered, 3, filters.budget, 1);
    showComboSuggestions([...combos2, ...combos3]);
  });
});
