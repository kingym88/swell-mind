import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SwellMind - Personalized Surf Forecasts",
  description: "AI-powered surf recommendations based on your preferences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <PreferencesProvider>
            {children}
          </PreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
