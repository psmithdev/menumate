"use client";
import { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { parseThaiMenu } from "../utils/parseThaiMenu";

async function translateMenu(menu) {
  const translatedMenu = [];
  for (const item of menu) {
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: item.nameTH, target: "en" }),
      });
      const data = await response.json();
      translatedMenu.push({
        ...item,
        nameEN: data.data.translations[0].translatedText,
      });
    } catch {
      translatedMenu.push({ ...item, nameEN: "[Translation failed]" });
    }
  }
  return translatedMenu;
}

export default function MenuUpload() {
  const fileInputRef = useRef();
  const [ocrText, setOcrText] = useState("");
  const [parsedMenu, setParsedMenu] = useState([]);
  const [translatedMenu, setTranslatedMenu] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <section>
      <h2>Step 1: Upload or Scan Menu</h2>
      <input type="file" ref={fileInputRef} accept="image/*" />
      <button
        onClick={async () => {
          const file = fileInputRef.current.files[0];
          if (!file) return;
          setLoading(true);
          const {
            data: { text },
          } = await Tesseract.recognize(file, "tha", {
            logger: (m) => console.log(m),
          });
          setOcrText(text);
          const parsed = parseThaiMenu(text);
          setParsedMenu(parsed);

          // Translate each dish name
          const translated = await translateMenu(parsed);
          setTranslatedMenu(translated);

          setLoading(false);
        }}
      >
        Scan & Translate
      </button>
      {loading && <p>Scanning...</p>}
      {ocrText && (
        <>
          <h3>Extracted Text:</h3>
          <pre>{ocrText}</pre>
        </>
      )}
      {parsedMenu.length > 0 && (
        <>
          <h3>Parsed Menu:</h3>
          <pre>{JSON.stringify(parsedMenu, null, 2)}</pre>
        </>
      )}
      {translatedMenu.length > 0 && (
        <>
          <h3>Menu with English Names:</h3>
          <pre>{JSON.stringify(translatedMenu, null, 2)}</pre>
        </>
      )}
    </section>
  );
}
