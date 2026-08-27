import type { Metadata } from "next";
import { Inter, Bebas_Neue, Rozha_One, Kalam, Caveat } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/LenisProvider";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import StructuredData from "@/components/StructuredData";
import { ViewProvider } from "@/context/ViewContext";

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

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const baseUrl = "https://www.adityaworks.online";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "AdityaWorks – Senior Full-stack Creative Developer & Motion Designer",
    template: "%s | AdityaWorks",
  },
  description: "Official portfolio of AdityaWorks, a Senior Full-stack Creative Developer specializing in experience-driven narratives. Also known as adityaworks, Aditya Work, or adityawork.",
  keywords: ["AdityaWorks", "adityaworks", "Aditya Work", "adityawork", "Creative Developer", "Motion Designer", "Portfolio"],
  authors: [{ name: "Aditya" }],
  creator: "Aditya",
  publisher: "AdityaWorks",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AdityaWorks – Senior Full-stack Creative Developer",
    description: "Experience-driven narratives through code and motion. Explore the cinematic digital presence of AdityaWorks.",
    url: baseUrl,
    siteName: "AdityaWorks",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/aditya/ADI (2).png",
        width: 1200,
        height: 630,
        alt: "AdityaWorks Portfolio Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AdityaWorks – Senior Creative Developer",
    description: "Digital presence of AdityaWorks. Senior Full-stack Creative Developer & Motion Designer.",
    images: ["/images/aditya/ADI (2).png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${bebas.variable} ${rozha.variable} ${kalam.variable} ${caveat.variable} antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <body 
        className="bg-background text-text selection:bg-accent selection:text-white overflow-x-hidden"
        suppressHydrationWarning
      >
        <ViewProvider>
          <LenisProvider>
            <div className="grain min-h-screen flex flex-col">
              <StructuredData />
              <CustomCursor />
              <Navbar />
              {children}
            </div>
          </LenisProvider>
        </ViewProvider>
      </body>
    </html>
  );
}
