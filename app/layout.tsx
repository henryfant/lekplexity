import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: "LEKplexity: AI-Powered Search for L.E.K.ers",
  description:
    "LEKplexity is an AI-powered search engine for L.E.K. Consulting.",
  icons: {
    icon: "/your-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}