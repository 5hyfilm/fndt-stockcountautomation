// src/components/headers/AppHeader.tsx
"use client";

import React from "react";
import { Product } from "../../types/product";
import { EmployeeHeader } from "./EmployeeHeader";
import { AppTitle } from "./AppTitle";
import { MobileTabNavigation } from "../navigation/MobileTabNavigation";
import { DesktopTabNavigation } from "../navigation/DesktopTabNavigation";
import { MobileStatusBar } from "../status/MobileStatusBar";
import { DesktopStatusBar } from "../status/DesktopStatusBar";

interface AppHeaderProps {
  employeeName: string;
  branchCode?: string;
  branchName?: string;
  formatTimeRemaining?: () => string;
  activeTab: "scanner" | "inventory";
  totalSKUs: number;
  isStreaming: boolean;
  lastDetectedCode?: string;
  product?: Product | null;
  totalItems: number;
  onLogout: () => void;
  onTabChange: (tab: "scanner" | "inventory") => void;
}

interface AppHeaderProps {
  employeeName: string;
  branchCode?: string;
  branchName?: string;
  formatTimeRemaining?: () => string;
  activeTab: "scanner" | "inventory";
  totalSKUs: number;
  isStreaming: boolean;
  lastDetectedCode?: string;
  product?: Product | null;
  totalItems: number;
  onLogout: () => void;
  onTabChange: (tab: "scanner" | "inventory") => void;
  isMobile?: boolean; // ✅ เพิ่ม prop สำหรับควบคุมจากภายนอก
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  employeeName,
  branchCode,
  branchName,
  formatTimeRemaining,
  activeTab,
  totalSKUs,
  isStreaming,
  lastDetectedCode,
  product,
  totalItems,
  onLogout,
  onTabChange,
  isMobile = false, // ✅ รับ prop แทนการ detect เอง
}) => {
  // ✅ ลบ mobile detection logic ออก - ใช้ prop แทน

  if (isMobile) {
    // Mobile layout
    return (
      <div
        className="bg-white border-b border-gray-200 sticky top-0 z-40"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 0px)",
        }}
      >
        <EmployeeHeader
          employeeName={employeeName}
          branchCode={branchCode}
          branchName={branchName}
          formatTimeRemaining={formatTimeRemaining}
          onLogout={onLogout}
          compact={true}
        />

        <AppTitle compact={true} />

        <MobileTabNavigation
          activeTab={activeTab}
          totalSKUs={totalSKUs}
          onTabChange={onTabChange}
        />

        <MobileStatusBar
          isStreaming={isStreaming}
          lastDetectedCode={lastDetectedCode}
          totalItems={totalItems}
        />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <EmployeeHeader
          employeeName={employeeName}
          branchCode={branchCode}
          branchName={branchName}
          formatTimeRemaining={formatTimeRemaining}
          onLogout={onLogout}
          compact={false}
        />

        <AppTitle compact={false} />

        <DesktopTabNavigation
          activeTab={activeTab}
          totalSKUs={totalSKUs}
          onTabChange={onTabChange}
        />

        <DesktopStatusBar
          isStreaming={isStreaming}
          lastDetectedCode={lastDetectedCode}
          product={product}
          totalItems={totalItems}
        />
      </div>
    </div>
  );
};
