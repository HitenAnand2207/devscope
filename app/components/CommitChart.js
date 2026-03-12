"use client";
// ─────────────────────────────────────────────
//  components/CommitChart.js
//  Bar chart showing repo activity over the
//  last 12 weeks (estimated from push dates).
// ─────────────────────────────────────────────

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function CommitChart({ weeklyActivity }) {
  const { labels, data: values } = weeklyActivity;

  const data = {
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
      <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-5">
        Push Activity — Last 12 Weeks
      </h3>
      <div style={{ height: "220px" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}