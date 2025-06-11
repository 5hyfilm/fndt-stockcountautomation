// src/components/headers/MobileEmployeeHeader.tsx
"use client";

import React from "react";
import { User, LogOut } from "lucide-react";

interface MobileEmployeeHeaderProps {
  employeeName: string;
  onLogout: () => void;
}

export const MobileEmployeeHeader: React.FC<MobileEmployeeHeaderProps> = ({
  employeeName,
  onLogout,
}) => {
  return (
    <div className="bg-gradient-to-r from-fn-green to-fn-red text-white">
      <div className="px-3 py-2 flex items-center justify-between">
        {/* Left side - Brand */}
        <div className="flex items-center gap-2">
          <div className="text-lg font-bold">FN</div>
          <div className="text-xs opacity-80">Stock</div>
        </div>

        {/* Right side - User info */}
        <div className="flex items-center gap-2 text-sm">
          <User size={14} />
          <span className="max-w-24 truncate">{employeeName}</span>
          <button
            onClick={onLogout}
            className="bg-white/20 hover:bg-white/30 p-1 rounded transition-colors"
            title="ออกจากระบบ"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
