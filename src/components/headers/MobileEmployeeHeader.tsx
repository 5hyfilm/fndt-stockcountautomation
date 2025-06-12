// src/components/headers/MobileEmployeeHeader.tsx
"use client";

import React from "react";
import { User, LogOut } from "lucide-react";
import Image from "next/image";

interface MobileEmployeeHeaderProps {
  employeeName: string;
  branchCode?: string;
  branchName?: string;
  onLogout: () => void;
}

export const MobileEmployeeHeader: React.FC<MobileEmployeeHeaderProps> = ({
  employeeName,
  onLogout,
}) => {
  return (
    <div className="bg-gradient-to-r from-fn-green to-fn-red text-white">
      <div className="px-3 py-2 flex items-center justify-between">
        {/* Left side - F&N Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/fn-logo.png"
            alt="F&N Logo"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
            priority
          />
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
