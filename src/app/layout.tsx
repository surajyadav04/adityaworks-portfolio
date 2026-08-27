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
  description: "Official portfolio of Aditya Kumar (AdityaWorks) – Senior Full-stack Creative Developer, Motion Designer, and AI Web Engineer specializing in WebGL, GSAP, Next.js, and immersive digital architectures. Available for high-impact freelance and engineering roles.",
  keywords: [
    // Identity & Branding
    "Aditya",
    "Aditya Kumar",
    "AdityaWorks",
    "adityaworks",
    "Aditya Work",
    "adityawork",
    "AdityaWorks Portfolio",
    "Aditya Developer",
    "mustbeaditya",
    "mustbeaditya.kumar",
    "surajyadav04",
    // Core Web Development
    "Web Developer",
    "Full Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "HTML",
    "HTML5",
    "CSS",
    "CSS3",
    "JavaScript",
    "TypeScript",
    "React",
    "React.js",
    "Next.js",
    "Next.js 15",
    "Node.js",
    "Tailwind CSS",
    "Java Developer",
    "Java",
    "Python",
    // Creative Development & Motion Design
    "Creative Developer",
    "Creative Coding",
    "Motion Designer",
    "Motion Design",
    "WebGL",
    "Three.js",
    "GSAP",
    "GreenSock Animation",
    "Lenis Scroll",
    "Canvas 2D",
    "GLSL Shaders",
    "Interactive Websites",
    "Awwwards SOTD",
    "FWA",
    "CSS Design Awards",
    "UI UX Designer",
    "Digital Experience Designer",
    // AI & Advanced Engineering
    "AI Engineer",
    "AI Web Developer",
    "Generative AI",
    "Generative Art",
    "Machine Learning Integration",
    "Full Stack AI Developer",
    // Freelancing & Hiring
    "Freelancer",
    "Freelance Web Developer",
    "Freelance Creative Developer",
    "Hire Frontend Developer",
    "Hire React Developer",
    "Hire Next.js Developer",
    "Hire Full Stack Developer",
    "Remote Web Developer",
    "Freelance Developer India",
    "Contract Developer",
    // SEO & Performance
    "SEO Expert",
    "Technical SEO",
    "Web Performance",
    "Core Web Vitals",
    "High-Performance Web Apps",
    // Social & Professional Profiles
    "AdityaWorks LinkedIn",
    "AdityaWorks Twitter",
    "AdityaWorks GitHub"
  ],
  authors: [{ name: "Aditya Kumar", url: "https://www.adityaworks.online" }],
  creator: "Aditya Kumar",
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
