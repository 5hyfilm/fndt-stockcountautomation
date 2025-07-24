// src/components/navigation/TabNavigation.tsx
"use client";

import React from "react";
import { Camera, Archive } from "lucide-react";

interface TabNavigationProps {
  activeTab: "scanner" | "inventory";
  totalSKUs: number;
  onTabChange: (tab: "scanner" | "inventory") => void;
  isMobile?: boolean; // ✅ รับ prop สำหรับควบคุม layout
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  isMobile = false,
}) => {
  if (isMobile) {
    // Mobile version - compact layout
    return (
      <div className="px-3 pb-2">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => onTabChange("scanner")}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              activeTab === "scanner"
                ? "bg-white text-fn-green shadow-sm"
                : "text-gray-600"
            }`}
          >
            <Camera size={14} />
            สแกน
          </button>
          <button
            onClick={() => onTabChange("inventory")}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              activeTab === "inventory"
                ? "bg-white text-fn-green shadow-sm"
                : "text-gray-600"
            }`}
          >
            <Archive size={14} />
            Inventory
          </button>
        </div>
      </div>
    );
  }

  // Desktop version - centered layout with full text
  return (
    <div className="flex justify-center">
      <div className="bg-gray-100 rounded-lg p-1 flex">
        <button
          onClick={() => onTabChange("scanner")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === "scanner"
              ? "bg-white text-fn-green shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <Camera size={16} />
          สแกนสินค้า
        </button>
        <button
          onClick={() => onTabChange("inventory")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === "inventory"
              ? "bg-white text-fn-green shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <Archive size={16} />
          จัดการ Inventory
        </button>
      </div>
    </div>
  );
};
