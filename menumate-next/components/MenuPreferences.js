"use client";
import React from "react";

export default function MenuPreferences() {
  return (
    <section id="preferences">
      <h2>Step 2: Set Your Preferences</h2>
      <form>
        <label>
          Spice Level:
          <select id="filter-spice">
            <option>Mild</option>
            <option>Medium</option>
            <option>Spicy</option>
          </select>
        </label>
        <label>
          Calories (max):
          <input
            id="filter-calories"
            type="number"
            min="0"
            placeholder="e.g. 500"
          />
        </label>
        <label>
          Protein (min grams):
          <input
            id="filter-protein"
            type="number"
            min="0"
            placeholder="e.g. 20"
          />
        </label>
        <label>
          <input id="filter-vegetarian" type="checkbox" /> Vegetarian
        </label>
        <label>
          <input id="filter-halal" type="checkbox" /> Halal
        </label>
        <label>
          <input id="filter-exclude-pork" type="checkbox" /> Exclude Pork
        </label>
        <label>
          <input id="filter-exclude-sugar" type="checkbox" /> Exclude Sugar
        </label>
        <label>
          <input id="filter-exclude-fructose" type="checkbox" /> Exclude High
          Fructose
        </label>
      </form>
    </section>
  );
}
