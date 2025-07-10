"use client";
import React from "react";
import { useState } from "react";
import MenuUpload from "../components/MenuUpload";
import MenuPreferences from "../components/MenuPreferences";
import MenuBudget from "../components/MenuBudget";
import MenuSuggestions from "../components/MenuSuggestions";
import MenuResults from "../components/MenuResults";
import RestaurantFinder from "../components/RestaurantFinder";
import AuthPlaceholder from "../components/AuthPlaceholder";
import QRCodeSection from "../components/QRCodeSection";

export default function Home() {
  // Preferences state
  const [preferences, setPreferences] = useState({
    spice: "Mild",
    calories: "",
    protein: "",
    vegetarian: false,
    halal: false,
    excludePork: false,
    excludeSugar: false,
    excludeFructose: false,
  });

  // State for menu and results
  const [translatedMenu, setTranslatedMenu] = useState([]); // from MenuUpload
  const [results, setResults] = useState([]);

  return (
    <div id="app">
      <header>
        <h1>Menu Mate</h1>
        <p>Food Ordering Suggestion Generator (Thailand)</p>
      </header>
      <MenuUpload setTranslatedMenu={setTranslatedMenu} />
      <MenuPreferences
        preferences={preferences}
        setPreferences={setPreferences}
      />
      <pre>{JSON.stringify(preferences, null, 2)}</pre>
      <MenuBudget />
      <MenuSuggestions
        preferences={preferences}
        menu={translatedMenu}
        setResults={setResults}
      />
      <MenuResults results={results} />
      <RestaurantFinder />
      <AuthPlaceholder />
      <QRCodeSection />
      {/* Add more components as you go */}
    </div>
  );
}
