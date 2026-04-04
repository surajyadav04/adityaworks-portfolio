"use client";

export default function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Aditya",
    "url": "https://www.adityaworks.online",
    "jobTitle": "Senior Full-stack Creative Developer & Motion Designer",
    "description": "Portfolio of AdityaWorks, specializing in experience-driven narratives through code and motion.",
    "alternateName": [
      "AdityaWorks",
      "adityaworks",
      "Aditya Work",
      "adityawork",
      "adityaWork"
    ],
    "sameAs": [
      "https://linkedin.com/in/adityaworks",
      "https://twitter.com/adityaworks",
      "https://github.com/surajyadav04"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
