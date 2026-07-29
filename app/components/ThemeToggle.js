"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const STORAGE_KEY = "devscope.theme";
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={theme === 'light'}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className="ml-3 px-3 py-2 rounded-full border border-dark-400 text-sm font-mono text-slate-300 hover:bg-slate-700/20 transition-colors"
    >
      {theme === 'light' ? '🌤 Light' : '🌙 Dark'}
    </button>
  );
}
