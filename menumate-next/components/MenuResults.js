"use client";
import React from "react";

export default function MenuResults({ results }) {
  return (
    <section id="results">
      <h2>Suggestions</h2>
      <div className="suggestion-list">
        {results.length === 0 ? (
          <p>No suggestions yet.</p>
        ) : (
          results.map((item, idx) => (
            <div key={idx} className="suggestion-item">
              <strong>{item.nameEN}</strong> ({item.nameTH})<br />
              {/* Add more info as needed */}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
