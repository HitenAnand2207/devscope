import "./globals.css";

// Metadata for the page tab/SEO
export const metadata = {
  title: "DevScope — Developer Activity Analyzer",
  description: "Analyze any GitHub developer's activity, languages, and productivity in seconds.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="noise-bg antialiased">{children}</body>
    </html>
  );
}