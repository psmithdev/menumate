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
      } = await Tesseract.recognize(selectedFile, "eng", {
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

  // Translation function (placeholder - you'll need to add your API key)
  async function translateText(text) {
    // For now, return a placeholder. You'll need to:
    // 1. Get a Google Translate API key
    // 2. Replace this with actual API call
    return `[Translated: ${text}] (Add your API key to enable real translation)`;
  }
});
