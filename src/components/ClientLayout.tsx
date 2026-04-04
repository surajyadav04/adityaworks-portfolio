"use client";

import { useState, createContext, useContext } from "react";
import LenisProvider from "@/components/LenisProvider";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import Preloader from "@/components/Preloader";

// 🌐 LOADING CONTEXT
const LoadingContext = createContext({ isLoaded: false });
export const useLoading = () => useContext(LoadingContext);

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoaded }}>
      <LenisProvider>
        <div className="relative">
          {/* 🌑 THE VICTOR PRELOADER */}
          {!isLoaded && (
            <Preloader onComplete={() => setIsLoaded(true)} />
          )}

          {/* 🚀 THE REVEALED SITE */}
          <div className={`transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0 h-screen overflow-hidden'}`}>
            <div className="grain min-h-screen flex flex-col">
              <CustomCursor />
              <Navbar />
              <main>{children}</main>
            </div>
          </div>
        </div>
      </LenisProvider>
    </LoadingContext.Provider>
  );
}
