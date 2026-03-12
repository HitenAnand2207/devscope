"use client";
// ─────────────────────────────────────────────
//  components/LanguageChart.js
//  Renders a doughnut chart of top languages.
//  Uses Chart.js via react-chartjs-2.
//  "use client" is required because Chart.js
//  needs the browser DOM to render.
// ─────────────────────────────────────────────

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Register the components Chart.js needs
ChartJS.register(ArcElement, Tooltip, Legend);

// Color palette for language slices
const COLORS = [
  "#00f5d4", "#0af",    "#a855f7", "#f59e0b",
  "#ef4444", "#10b981", "#f97316", "#6366f1",
];

export default function LanguageChart({ languages }) {
  const labels = Object.keys(languages);
  const values = Object.values(languages);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: COLORS.slice(0, labels.length),
        borderColor: "#0a0e1a",
        borderWidth: 3,
        hoverBorderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#94a3b8",    // slate-400
          font: { family: "'JetBrains Mono'", size: 11 },
          padding: 14,
          boxWidth: 12,
          boxHeight: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.raw} repos`,
        },
        backgroundColor: "#0f1626",
        titleColor: "#00f5d4",
        bodyColor: "#e2e8f0",
        borderColor: "#2a3a5c",
        borderWidth: 1,
      },
    },
    cutout: "65%",
  };

  return (
    <div className="glass-card p-6 animate-fade-up delay-400" style={{ opacity: 0 }}>
      <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-5">
        Language Distribution
      </h3>
      <div style={{ height: "220px" }}>
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
}