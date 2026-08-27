import { Metadata } from "next";
import AboutClient from "@/components/pages/AboutClient";

export const metadata: Metadata = {
  title: "About Aditya Kumar – Senior Full-stack Creative Developer",
  description: "Explore the architectural roots, creative development philosophy, and motion systems engineered by Aditya Kumar (AdityaWorks).",
  alternates: {
    canonical: "https://www.adityaworks.online/about",
  },
  openGraph: {
    title: "About Aditya Kumar – Senior Creative Developer | AdityaWorks",
    description: "Explore the story, architectural origins, and motion philosophy of Aditya Kumar.",
    url: "https://www.adityaworks.online/about",
    type: "profile",
    images: [
      {
        url: "https://www.adityaworks.online/images/aditya/ADI%20(2).png",
        width: 1200,
        height: 630,
        alt: "Aditya Kumar - Creative Developer Profile",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Aditya Kumar – Senior Creative Developer",
    description: "Architectural origins, creative coding, and motion systems engineered by Aditya Kumar.",
    images: ["https://www.adityaworks.online/images/aditya/ADI%20(2).png"],
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
