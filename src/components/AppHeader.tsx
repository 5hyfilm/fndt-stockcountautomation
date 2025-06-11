// src/components/AppHeader.tsx
"use client";

import React, { useState } from "react";
import { User, Building2, LogOut, Menu, X, ChevronDown } from "lucide-react";

interface EmployeeInfo {
  employeeName: string;
  branchCode: string;
  branchName: string;
  timestamp: string;
}

interface AppHeaderProps {
  employee: EmployeeInfo;
  onLogout: () => void;
  compact?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  employee,
  onLogout,
  compact = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Compact mobile layout
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-fn-green to-fn-red text-white">
        <div className="px-3 py-2 flex items-center justify-between">
          {/* Left side - Brand */}
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold">FN</div>
            <div className="text-xs opacity-80">Stock</div>
          </div>

          {/* Right side - User menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-md px-2 py-1 text-sm"
            >
              <User size={14} />
              <span className="max-w-20 truncate">{employee.employeeName}</span>
              <ChevronDown
                size={12}
                className={`transition-transform ${
                  showMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 min-w-48">
                <div className="p-3 bg-gray-50 border-b">
                  <div className="text-sm font-medium text-gray-900">
                    {employee.employeeName}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Building2 size={12} />
                    {employee.branchName}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    รหัส: {employee.branchCode}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onLogout();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={14} />
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Overlay to close menu */}
        {showMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
        )}
      </div>
    );
  }

  // Desktop layout (original)
  return (
    <div className="bg-gradient-to-r from-fn-green to-fn-red text-white">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Brand and title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                <Building2 size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">FN Stock Management</h1>
                <p className="text-white/80 text-sm">
                  ระบบตรวจจับและจัดการสต็อก
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Employee info and logout */}
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <User size={20} />
                </div>
                <div>
                  <div className="font-medium">{employee.employeeName}</div>
                  <div className="text-white/80 text-sm flex items-center gap-1">
                    <Building2 size={14} />
                    {employee.branchName} ({employee.branchCode})
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 p-3 rounded-lg border border-white/20 transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
