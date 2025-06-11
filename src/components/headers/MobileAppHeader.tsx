// src/components/headers/MobileAppHeader.tsx
"use client";

import React from "react";
import { MobileEmployeeHeader } from "./MobileEmployeeHeader";
import { MobileAppTitle } from "./MobileAppTitle";
import { MobileTabNavigation } from "../navigation/MobileTabNavigation";
import { MobileStatusBar } from "../status/MobileStatusBar";

interface MobileAppHeaderProps {
  employeeName: string;
  activeTab: "scanner" | "inventory";
  totalProducts: number;
  isStreaming: boolean;
  lastDetectedCode?: string;
  totalItems: number;
  onLogout: () => void;
  onTabChange: (tab: "scanner" | "inventory") => void;
}

export const MobileAppHeader: React.FC<MobileAppHeaderProps> = ({
  employeeName,
  activeTab,
  totalProducts,
  isStreaming,
  lastDetectedCode,
  totalItems,
  onLogout,
  onTabChange,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <MobileEmployeeHeader employeeName={employeeName} onLogout={onLogout} />

      <MobileAppTitle />

      <MobileTabNavigation
        activeTab={activeTab}
        totalProducts={totalProducts}
        onTabChange={onTabChange}
      />

      <MobileStatusBar
        isStreaming={isStreaming}
        lastDetectedCode={lastDetectedCode}
        totalItems={totalItems}
      />
    </div>
  );
};
