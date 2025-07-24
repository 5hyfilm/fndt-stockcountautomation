// Path: src/components/layout/MobileLayout.tsx
"use client";

import React, { useEffect } from "react";
// ✅ Import AppHeaderProps type เพื่อแก้ไข TypeScript errors (no-explicit-any)
import { AppHeader, AppHeaderProps } from "../headers/AppHeader";
import { Product } from "../../types/product";

// ✅ ใช้ type ที่สอดคล้องกับ project (ไม่ duplicate)
interface EmployeeInfo {
  employeeName: string;
  branchCode: string;
  branchName: string;
  timestamp: string;
}

// ✅ Simplified props - ลบ logic ที่ซับซ้อนออก
interface MobileLayoutProps {
  employee: EmployeeInfo;
  onLogout: () => void;
  children: React.ReactNode;

  // Layout control
  fullScreenMode?: boolean;
  hideHeaderInFullScreen?: boolean;
  isMobile?: boolean; // ✅ รับ prop แทนการ detect เอง

  // AppHeader props - pass through to header (ลบ totalSKUs แล้ว)
  activeTab?: "scanner" | "inventory";
  isStreaming?: boolean;
  lastDetectedCode?: string;
  product?: Product | null;
  totalItems?: number;
  onTabChange?: (tab: "scanner" | "inventory") => void;
  formatTimeRemaining?: () => string;

  // Optional styling
  className?: string;
  contentClassName?: string;
}

// ✅ Full Screen Layout Component - แยกออกมาเพื่อความชัดเจน
const FullScreenLayout: React.FC<{
  children: React.ReactNode;
  hideHeader: boolean;
  headerProps?: AppHeaderProps; // ✅ แก้ไขจาก any เป็น AppHeaderProps
}> = ({ children, hideHeader, headerProps }) => (
  <div
    className="min-h-screen w-full bg-black flex flex-col"
    style={{
      paddingTop: "env(safe-area-inset-top)",
      paddingBottom: "env(safe-area-inset-bottom)",
      paddingLeft: "env(safe-area-inset-left)",
      paddingRight: "env(safe-area-inset-right)",
    }}
  >
    {/* Optional floating header */}
    {!hideHeader && headerProps && (
      <div className="absolute top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm">
        <AppHeader {...headerProps} isMobile={true} />
      </div>
    )}

    {/* Full screen content */}
    <div className={`flex-1 ${!hideHeader ? "pt-16" : ""}`}>{children}</div>
  </div>
);

// ✅ Regular Layout Component - แยกออกมาเพื่อความชัดเจน
const RegularLayout: React.FC<{
  children: React.ReactNode;
  headerProps: AppHeaderProps; // ✅ แก้ไขจาก any เป็น AppHeaderProps
  isMobile: boolean;
  className?: string;
  contentClassName?: string;
}> = ({ children, headerProps, isMobile, className, contentClassName }) => (
  <div className={`min-h-screen bg-gray-50 flex flex-col ${className || ""}`}>
    {/* Header */}
    <AppHeader {...headerProps} isMobile={isMobile} />

    {/* Main Content */}
    <main
      className={`flex-1 ${
        isMobile
          ? "px-2 py-3" // Minimal padding on mobile
          : "container mx-auto px-6 py-6" // More spacious on desktop
      } ${contentClassName || ""}`}
    >
      {children}
    </main>
  </div>
);

// ✅ Main MobileLayout Component - Simplified และ Complete
export const MobileLayout: React.FC<MobileLayoutProps> = ({
  employee,
  onLogout,
  children,
  fullScreenMode = false,
  hideHeaderInFullScreen = true,
  isMobile = true, // ✅ Default เป็น mobile (ตามชื่อ component)

  // AppHeader props (ลบ totalSKUs แล้ว)
  activeTab = "scanner",
  isStreaming = false,
  lastDetectedCode,
  product,
  totalItems = 0,
  onTabChange = () => {},
  formatTimeRemaining,

  // Styling props
  className,
  contentClassName,
}) => {
  // ✅ Handle full screen mode body styles (Simplified)
  useEffect(() => {
    if (fullScreenMode) {
      // Add full screen class for CSS targeting
      document.body.classList.add("fullscreen-mode");

      // Prevent scrolling in full screen
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      // Remove full screen styling
      document.body.classList.remove("fullscreen-mode");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("fullscreen-mode");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [fullScreenMode]);

  // ✅ Create header props object (DRY principle) - ลบ totalSKUs
  const headerProps = {
    employeeName: employee.employeeName,
    branchCode: employee.branchCode,
    branchName: employee.branchName,
    formatTimeRemaining,
    activeTab,
    isStreaming,
    lastDetectedCode,
    product,
    totalItems,
    onLogout,
    onTabChange,
  };

  // ✅ Conditional rendering based on full screen mode
  if (fullScreenMode) {
    return (
      <FullScreenLayout
        hideHeader={hideHeaderInFullScreen}
        headerProps={hideHeaderInFullScreen ? undefined : headerProps}
      >
        {children}
      </FullScreenLayout>
    );
  }

  // ✅ Regular layout
  return (
    <RegularLayout
      headerProps={headerProps}
      isMobile={isMobile}
      className={className}
      contentClassName={contentClassName}
    >
      {children}
    </RegularLayout>
  );
};

// ✅ Export types สำหรับใช้ใน components อื่น (Fixed TypeScript errors - no any types)
export type { MobileLayoutProps, EmployeeInfo };
