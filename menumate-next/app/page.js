"use client";
import React from "react";
import MenuUpload from "../components/MenuUpload";
import MenuPreferences from "../components/MenuPreferences";
import MenuBudget from "../components/MenuBudget";
import MenuSuggestions from "../components/MenuSuggestions";
import MenuResults from "../components/MenuResults";
import RestaurantFinder from "../components/RestaurantFinder";
import AuthPlaceholder from "../components/AuthPlaceholder";
import QRCodeSection from "../components/QRCodeSection";

export default function Home() {
  return (
    <div id="app">
      <header>
        <h1>Menu Mate</h1>
        <p>Food Ordering Suggestion Generator (Thailand)</p>
      </header>
      <MenuUpload />
      <MenuPreferences />
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
