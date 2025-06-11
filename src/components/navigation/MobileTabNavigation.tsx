// src/components/navigation/MobileTabNavigation.tsx
"use client";

import React from "react";
import { Camera, Archive } from "lucide-react";

interface MobileTabNavigationProps {
  activeTab: "scanner" | "inventory";
  totalProducts: number;
  onTabChange: (tab: "scanner" | "inventory") => void;
}

export const MobileTabNavigation: React.FC<MobileTabNavigationProps> = ({
  activeTab,
  totalProducts,
  onTabChange,
}) => {
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
          Stock
          {totalProducts > 0 && (
            <span className="bg-fn-green text-white text-xs px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none">
              {totalProducts}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
