import "./globals.css";
import AuthButton from './components/AuthButton';

// Richer metadata for SEO, social cards and PWAs
export const metadata = {
  title: "DevScope — Developer Activity Analyzer",
  description: "Analyze any GitHub developer's activity, languages, and productivity in seconds.",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#0f172a",
  openGraph: {
    title: "DevScope — Developer Activity Analyzer",
    description:
      "Analyze any GitHub developer's activity, languages, and productivity in seconds.",
    siteName: "DevScope",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevScope — Developer Activity Analyzer",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="noise-bg antialiased">{children}<AuthButton /></body>
    </html>
  );
}