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
    return {
      spice,
      calories,
      protein,
      vegetarian,
      halal,
      excludePork,
      excludeSugar,
      excludeFructose,
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
        Calories: ${item.calories}, Protein: ${item.protein}g, Spice: ${
            item.spice
          }<br>
        ${item.vegetarian ? "Vegetarian" : ""} ${item.halal ? "Halal" : ""}
      </div>`
      )
      .join("");
  }

  // --- Button Event Listeners ---
  document.getElementById("btn-what-to-eat").addEventListener("click", () => {
    const filters = getFilters();
    showSuggestions(filterMenu(filters));
  });
  document.getElementById("btn-vegetarian").addEventListener("click", () => {
    const filters = getFilters();
    filters.vegetarian = true;
    showSuggestions(filterMenu(filters));
  });
  document.getElementById("btn-bodybuilder").addEventListener("click", () => {
    const filters = getFilters();
    filters.protein = Math.max(filters.protein, 20);
    showSuggestions(filterMenu(filters));
  });
  document.getElementById("btn-spicy").addEventListener("click", () => {
    const filters = getFilters();
    filters.spice = "Spicy";
    showSuggestions(filterMenu(filters));
  });
  document.getElementById("btn-surprise").addEventListener("click", () => {
    const filters = getFilters();
    const filtered = filterMenu(filters);
    if (filtered.length) {
      showSuggestions([filtered[Math.floor(Math.random() * filtered.length)]]);
    } else {
      showSuggestions([]);
    }
  });
});
