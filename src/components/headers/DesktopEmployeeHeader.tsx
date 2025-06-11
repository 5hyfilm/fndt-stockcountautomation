// src/components/headers/DesktopEmployeeHeader.tsx
"use client";

import React from "react";
import { User, LogOut, Clock } from "lucide-react";

interface DesktopEmployeeHeaderProps {
  employeeName: string;
  branchCode: string;
  branchName: string;
  formatTimeRemaining: () => string;
  onLogout: () => void;
}

export const DesktopEmployeeHeader: React.FC<DesktopEmployeeHeaderProps> = ({
  employeeName,
  branchCode,
  branchName,
  formatTimeRemaining,
  onLogout,
}) => {
  return (
    <div className="bg-gradient-to-r from-fn-green/10 to-fn-red/10 border border-fn-green/30 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-fn-green/20 p-2 rounded-lg">
            <User className="fn-green" size={16} />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{employeeName}</div>
            <div className="text-sm text-gray-600">
              {branchCode} - {branchName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              เหลือเวลา: {formatTimeRemaining()}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="ออกจากระบบ"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
