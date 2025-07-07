"use client";
import React from "react";

export default function MenuPreferences({ preferences, setPreferences }) {
  return (
    <section id="preferences">
      <h2>Step 2: Set Your Preferences</h2>
      <form>
        <label>
          Spice Level:
          <select
            id="filter-spice"
            value={preferences.spice}
            onChange={(e) =>
              setPreferences((prev) => ({ ...prev, spice: e.target.value }))
            }
          >
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
            value={preferences.calories}
            onChange={(e) =>
              setPreferences((prev) => ({ ...prev, calories: e.target.value }))
            }
          />
        </label>
        <label>
          Protein (min grams):
          <input
            id="filter-protein"
            type="number"
            min="0"
            placeholder="e.g. 20"
            value={preferences.protein}
            onChange={(e) =>
              setPreferences((prev) => ({ ...prev, protein: e.target.value }))
            }
          />
        </label>
        <label>
          <input
            id="filter-vegetarian"
            type="checkbox"
            checked={preferences.vegetarian}
            onChange={(e) =>
              setPreferences((prev) => ({
                ...prev,
                vegetarian: e.target.checked,
              }))
            }
          />{" "}
          Vegetarian
        </label>
        <label>
          <input
            id="filter-halal"
            type="checkbox"
            checked={preferences.halal}
            onChange={(e) =>
              setPreferences((prev) => ({ ...prev, halal: e.target.checked }))
            }
          />{" "}
          Halal
        </label>
        <label>
          <input
            id="filter-exclude-pork"
            type="checkbox"
            checked={preferences.excludePork}
            onChange={(e) =>
              setPreferences((prev) => ({
                ...prev,
                excludePork: e.target.checked,
              }))
            }
          />{" "}
          Exclude Pork
        </label>
        <label>
          <input
            id="filter-exclude-sugar"
            type="checkbox"
            checked={preferences.excludeSugar}
            onChange={(e) =>
              setPreferences((prev) => ({
                ...prev,
                excludeSugar: e.target.checked,
              }))
            }
          />{" "}
          Exclude Sugar
        </label>
        <label>
          <input
            id="filter-exclude-fructose"
            type="checkbox"
            checked={preferences.excludeFructose}
            onChange={(e) =>
              setPreferences((prev) => ({
                ...prev,
                excludeFructose: e.target.checked,
              }))
            }
          />{" "}
          Exclude High Fructose
        </label>
      </form>
    </section>
  );
}
