"use client";
import React from "react";

export default function MenuSuggestions({ preferences, menu, setResults }) {
  function filterMenu() {
    return menu.filter((item) => {
      // Example filter logic:
      if (preferences.vegetarian && !item.tags?.includes("vegetarian"))
        return false;
      if (preferences.halal && !item.tags?.includes("halal")) return false;
      // Add more filters for spice, calories, protein, etc.
      if (preferences.spice && item.spice && item.spice !== preferences.spice)
        return false;
      if (
        preferences.calories &&
        item.calories &&
        item.calories > Number(preferences.calories)
      )
        return false;
      if (
        preferences.protein &&
        item.protein &&
        item.protein < Number(preferences.protein)
      )
        return false;
      // ...add more as needed
      return true;
    });
  }

  return (
    <section id="suggestions">
      <h2>Step 3: Get Suggestions</h2>
      <button onClick={() => setResults(filterMenu())}>What to eat?</button>
      {/* Add other buttons as needed */}
    </section>
  );
}
