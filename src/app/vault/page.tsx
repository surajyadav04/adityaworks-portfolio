import { Metadata } from "next";
import VaultClient from "@/components/pages/VaultClient";

export const metadata: Metadata = {
  title: "The Vault – Cinema, Books, Sound & Art | AdityaWorks",
  description: "A curated archive of the films, literature, ambient frequencies, and architectural forms that shape the engineering philosophy of Aditya Kumar.",
  alternates: {
    canonical: "https://www.adityaworks.online/vault",
  },
  openGraph: {
    title: "The Vault – Cinema, Books, Sound & Art | AdityaWorks",
    description: "Explore the cultural and artistic influences behind Aditya Kumar's creative development and motion systems.",
    url: "https://www.adityaworks.online/vault",
    type: "website",
  },
};

export default function VaultPage() {
  return <VaultClient />;
}

