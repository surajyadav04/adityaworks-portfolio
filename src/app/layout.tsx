import type { Metadata } from "next";
import { Inter, Bebas_Neue, Rozha_One, Kalam } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/LenisProvider";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
});

const rozha = Rozha_One({
  weight: "400",
  variable: "--font-rozha",
  subsets: ["latin", "devanagari"],
});

const kalam = Kalam({
  weight: "700",
  variable: "--font-kalam",
  subsets: ["latin", "devanagari"],
});

export const metadata: Metadata = {
  title: "Aditya/Works",
  description: "Senior Designer & Developer Portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable} ${rozha.variable} ${kalam.variable} antialiased scroll-smooth`}>

      <body className="bg-background text-text selection:bg-accent selection:text-white overflow-x-hidden">
        <LenisProvider>
          <div className="grain min-h-screen flex flex-col">
            <CustomCursor />
            <Navbar />
            {children}
          </div>
        </LenisProvider>
      </body>
    </html>
  );
}


