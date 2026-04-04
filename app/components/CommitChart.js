"use client";
// ─────────────────────────────────────────────
//  components/CommitChart.js
//  Bar chart showing repo activity over the
//  last 12 weeks (estimated from push dates).
// ─────────────────────────────────────────────

import { useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

export default function CommitChart({ weeklyActivity }) {
  const [viewMode, setViewMode] = useState("bar");
  const { labels, data: values } = weeklyActivity;

  const barData = {
    labels,
    datasets: [
      {
        label: "Repo pushes",
        data: values,
        // Gradient-like effect: active weeks are brighter
        backgroundColor: values.map((v) =>
          v > 0
            ? "rgba(0, 245, 212, 0.7)"
            : "rgba(42, 58, 92, 0.4)"
        ),
        borderColor: values.map((v) =>
          v > 0 ? "rgba(0, 245, 212, 1)" : "rgba(42, 58, 92, 0.6)"
        ),
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const lineData = {
    labels,
    datasets: [
      {
        label: "Repo pushes",
        data: values,
        borderColor: "rgba(0, 245, 212, 0.95)",
        backgroundColor: "rgba(0, 245, 212, 0.2)",
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 4,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw} push${ctx.raw !== 1 ? "es" : ""}`,
        },
        backgroundColor: "#0f1626",
        titleColor: "#00f5d4",
        bodyColor: "#e2e8f0",
        borderColor: "#2a3a5c",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#475569",   // slate-600
          font: { family: "'JetBrains Mono'", size: 10 },
          maxRotation: 45,
        },
        grid: { color: "rgba(42, 58, 92, 0.3)" },
      },
      y: {
        ticks: {
          color: "#475569",
          font: { family: "'JetBrains Mono'", size: 10 },
          stepSize: 1,
        },
        grid: { color: "rgba(42, 58, 92, 0.3)" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="glass-card p-6 animate-fade-up delay-500" style={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500">
          Push Activity — Last 12 Weeks
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">View</span>
          {[
            { id: "bar", label: "Bars" },
            { id: "line", label: "Line" },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setViewMode(mode.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors ${
                viewMode === mode.id
                  ? "border-cyan-400/60 text-cyan-300 bg-cyan-400/10"
                  : "border-dark-400 text-slate-500 hover:text-slate-300"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: "220px" }}>
        {viewMode === "bar" ? (
          <Bar data={barData} options={options} />
        ) : (
          <Line data={lineData} options={options} />
        )}
      </div>
    </div>
  );
}