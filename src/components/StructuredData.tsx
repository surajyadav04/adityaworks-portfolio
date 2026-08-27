"use client";

export default function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": "https://www.adityaworks.online/#person",
        "name": "Aditya Kumar",
        "alternateName": [
          "AdityaWorks",
          "adityaworks",
          "Aditya Work",
          "adityawork",
          "Aditya"
        ],
        "url": "https://www.adityaworks.online",
        "image": "https://www.adityaworks.online/images/aditya/ADI%20(2).png",
        "jobTitle": "Senior Full-stack Creative Developer & Motion Designer",
        "email": "mustbeaditya.kumar@gmail.com",
        "description": "Senior Full-stack Creative Developer and Motion Designer crafting experience-driven narratives through high-performance code, WebGL, and GSAP motion architecture.",
        "sameAs": [
          "https://linkedin.com/in/adityaworks",
          "https://twitter.com/adityaworks",
          "https://github.com/surajyadav04"
        ],
        "knowsAbout": [
          "Creative Development",
          "Web Development",
          "Full Stack Engineering",
          "Frontend Development",
          "Backend Development",
          "HTML & HTML5 Semantic Architecture",
          "CSS & CSS3 Advanced Animations",
          "JavaScript & TypeScript",
          "React.js & Next.js 15",
          "Node.js",
          "Java Development & Object Oriented Programming",
          "Python Programming",
          "AI Engineering & Generative AI Integration",
          "Motion Design & Interactive 3D",
          "WebGL & Three.js",
          "GSAP Animation & ScrollTrigger",
          "Lenis Smooth Scrolling",
          "GLSL Shaders & 2D Canvas Engines",
          "UI/UX Architecture & Design Systems",
          "Technical SEO & Web Performance Optimization",
          "Freelance Software Engineering & Consulting"
        ],
        "hasOccupation": {
          "@type": "Occupation",
          "name": "Senior Full-stack Creative Developer & AI Web Engineer",
          "occupationLocation": {
            "@type": "Country",
            "name": "India"
          },
          "skills": "Next.js, React, TypeScript, JavaScript, HTML5, CSS3, Java, Python, WebGL, Three.js, GSAP, Motion Design, AI Engineering, Full Stack Web Development, Technical SEO, Freelancing"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://www.adityaworks.online/#website",
        "url": "https://www.adityaworks.online",
        "name": "AdityaWorks",
        "description": "Official portfolio of AdityaWorks — Senior Full-stack Creative Developer & Motion Designer.",
        "publisher": {
          "@id": "https://www.adityaworks.online/#person"
        },
        "inLanguage": "en-US"
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

