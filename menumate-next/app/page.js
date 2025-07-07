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

  // ...other state (budget, menu, results) will go here

  return (
    <div id="app">
      <header>
        <h1>Menu Mate</h1>
        <p>Food Ordering Suggestion Generator (Thailand)</p>
      </header>
      <MenuUpload />
      <MenuPreferences
        preferences={preferences}
        setPreferences={setPreferences}
      />
      <pre>{JSON.stringify(preferences, null, 2)}</pre>
      <MenuBudget />
      <MenuSuggestions />
      <MenuResults />
      <RestaurantFinder />
      <AuthPlaceholder />
      <QRCodeSection />
      {/* Add more components as you go */}
    </div>
  );
}
