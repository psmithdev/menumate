"use client";
import React from "react";

export default function MenuBudget() {
  return (
    <section id="budget">
      <h2>Budget</h2>
      <label>
        How much do you have? (Baht)
        <input id="budget-input" type="number" min="0" placeholder="e.g. 150" />
      </label>
    </section>
  );
}
