// src/components/layout/MobileLayout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../headers/AppHeader"; // ✅ เปลี่ยน import path
import { Product } from "../../types/product"; // ✅ เพิ่ม import Product type

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
  fullScreenMode?: boolean;
  hideHeaderInFullScreen?: boolean;
  // ✅ เพิ่ม props ที่ AppHeader ต้องการ
  activeTab?: "scanner" | "inventory";
  totalSKUs?: number;
  isStreaming?: boolean;
  lastDetectedCode?: string;
  product?: Product | null; // ✅ แก้ไขจาก any เป็น Product | null
  totalItems?: number;
  onTabChange?: (tab: "scanner" | "inventory") => void;
  formatTimeRemaining?: () => string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  employee,
  onLogout,
  children,
  fullScreenMode = false,
  hideHeaderInFullScreen = true,
  // ✅ รับ props เพิ่มเติม
  activeTab = "scanner",
  totalSKUs = 0,
  isStreaming = false,
  lastDetectedCode,
  product,
  totalItems = 0,
  onTabChange = () => {},
  formatTimeRemaining,
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

  // Add/remove body class for full screen mode
  useEffect(() => {
    if (fullScreenMode && isMobile) {
      document.body.classList.add("fullscreen-active");
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    } else {
      document.body.classList.remove("fullscreen-active");
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }

    return () => {
      document.body.classList.remove("fullscreen-active");
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [fullScreenMode, isMobile]);

  // Full screen mode layout
  if (fullScreenMode && isMobile) {
    return (
      <div
        className="min-h-screen w-full bg-black"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Optional floating header */}
        {!hideHeaderInFullScreen && (
          <div
            className="absolute top-0 left-0 right-0 z-50"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            {/* ✅ ใช้ AppHeader เวอร์ชันใหม่ - แต่ต้องส่ง props ที่ถูกต้อง */}
            <AppHeader
              employeeName={employee.employeeName}
              branchCode={employee.branchCode}
              branchName={employee.branchName}
              formatTimeRemaining={formatTimeRemaining}
              activeTab={activeTab}
              totalSKUs={totalSKUs}
              isStreaming={isStreaming}
              lastDetectedCode={lastDetectedCode}
              product={product}
              totalItems={totalItems}
              onLogout={onLogout}
              onTabChange={onTabChange}
              isMobile={true}
            />
          </div>
        )}

        {/* Full screen content */}
        {children}
      </div>
    );
  }

  // Regular layout
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col mobile-viewport">
      {/* ✅ Header - ใช้ AppHeader เวอร์ชันใหม่ */}
      <AppHeader
        employeeName={employee.employeeName}
        branchCode={employee.branchCode}
        branchName={employee.branchName}
        formatTimeRemaining={formatTimeRemaining}
        activeTab={activeTab}
        totalSKUs={totalSKUs}
        isStreaming={isStreaming}
        lastDetectedCode={lastDetectedCode}
        product={product}
        totalItems={totalItems}
        onLogout={onLogout}
        onTabChange={onTabChange}
        isMobile={isMobile}
      />

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
