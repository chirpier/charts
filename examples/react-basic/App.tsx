import React from "react";
import { ChirpierChart } from "@chirpier/charts";

export function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 20px",
        background: "linear-gradient(180deg, #f3efe6 0%, #fffdfa 100%)",
        color: "#1f2937",
        fontFamily: "Georgia, serif",
      }}
    >
      <section
        style={{
          maxWidth: 960,
          margin: "0 auto",
          background: "rgba(255,255,255,0.92)",
          border: "1px solid #d6cec0",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 24px 60px rgba(31, 41, 55, 0.08)",
        }}
      >
        <h1>React Chirpier Event Embed</h1>
        <p>Replace the props below with a real public event ID from your Chirpier project.</p>
        <ChirpierChart
          eventId="your-event-id"
          shareToken="your-share-token"
          view="timeseries"
          variant="line"
          range="1w"
          compare
          header={false}
          autoResize
          minHeight={320}
          loadingFallback={<div style={{ minHeight: 320 }}>Loading chart...</div>}
          onError={(error) => {
            console.error(error.code, error.message);
          }}
        />
      </section>
    </main>
  );
}
