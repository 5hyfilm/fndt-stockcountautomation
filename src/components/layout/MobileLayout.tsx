// src/components/layout/MobileLayout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../AppHeader";

interface EmployeeInfo {
  employeeName: string;
  branchCode: string;
  branchName: string;
  timestamp: string;
}

interface MobileLayoutProps {
  employee: EmployeeInfo;
  onLogout: () => void;
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  employee,
  onLogout,
  children,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <AppHeader employee={employee} onLogout={onLogout} compact={isMobile} />

      {/* Main Content */}
      <main
        className={`flex-1 ${
          isMobile
            ? "px-2 py-3" // Minimal padding on mobile
            : "container mx-auto px-6 py-6" // More spacious on desktop
        }`}
      >
        {children}
      </main>
    </div>
  );
};
