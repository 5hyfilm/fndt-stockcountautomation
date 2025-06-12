// src/components/AppHeader.tsx
"use client";

import React, { useState } from "react";
import { LogOut, User, MapPin, Clock, Menu, X } from "lucide-react";

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
  transparent?: boolean; // New prop for transparent background
  floating?: boolean; // New prop for floating header
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  employee,
  onLogout,
  compact = false,
  transparent = false,
  floating = false,
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Dynamic header classes
  const getHeaderClasses = () => {
    let classes = "w-full transition-all duration-200";

    if (floating) {
      classes += " fixed top-0 left-0 right-0 z-50";
    }

    if (transparent) {
      classes += " bg-black/20 backdrop-blur-sm border-b border-white/10";
    } else {
      classes += " bg-white border-b border-gray-200 shadow-sm";
    }

    if (compact) {
      classes += " px-3 py-2";
    } else {
      classes += " px-6 py-4";
    }

    return classes;
  };

  // Dynamic text classes
  const getTextClasses = (variant: "primary" | "secondary" = "primary") => {
    if (transparent) {
      return variant === "primary"
        ? "text-white camera-text-shadow"
        : "text-white/80 camera-text-shadow";
    }
    return variant === "primary" ? "text-gray-900" : "text-gray-600";
  };

  // Dynamic button classes
  const getButtonClasses = () => {
    if (transparent) {
      return "camera-overlay-button text-sm";
    }
    return compact
      ? "bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
      : "bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors";
  };

  const toggleMobileMenu = () => setShowMobileMenu(!showMobileMenu);

  return (
    <>
      <header className={getHeaderClasses()}>
        <div className="flex items-center justify-between">
          {/* Left side - Employee info */}
          <div className="flex items-center gap-3">
            <div
              className={`${transparent ? "bg-white/20" : "bg-gray-100"} ${
                compact ? "p-1.5" : "p-2"
              } rounded-full`}
            >
              <User size={compact ? 16 : 20} className={getTextClasses()} />
            </div>

            {/* Desktop info - always show */}
            <div className="hidden sm:block">
              <div
                className={`${
                  compact ? "text-sm" : "text-base"
                } font-medium ${getTextClasses()}`}
              >
                {employee.employeeName}
              </div>
              <div
                className={`${compact ? "text-xs" : "text-sm"} ${getTextClasses(
                  "secondary"
                )} flex items-center gap-4`}
              >
                <span className="flex items-center gap-1">
                  <MapPin size={compact ? 12 : 14} />
                  {employee.branchCode} - {employee.branchName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={compact ? 12 : 14} />
                  {employee.timestamp}
                </span>
              </div>
            </div>

            {/* Mobile - show name only, menu button for details */}
            <div className="sm:hidden">
              <div
                className={`${
                  compact ? "text-sm" : "text-base"
                } font-medium ${getTextClasses()}`}
              >
                {employee.employeeName}
              </div>
              <button
                onClick={toggleMobileMenu}
                className={`${compact ? "text-xs" : "text-sm"} ${getTextClasses(
                  "secondary"
                )} flex items-center gap-1 mt-0.5`}
              >
                <Menu size={compact ? 12 : 14} />
                รายละเอียด
              </button>
            </div>
          </div>

          {/* Right side - Logout button */}
          <button onClick={onLogout} className={getButtonClasses()}>
            <LogOut size={compact ? 14 : 16} className="mr-1" />
            ออกจากระบบ
          </button>
        </div>

        {/* Mobile menu overlay */}
        {showMobileMenu && (
          <div className="sm:hidden">
            <div
              className={`mt-3 pt-3 border-t ${
                transparent ? "border-white/20" : "border-gray-200"
              }`}
            >
              <div
                className={`${compact ? "text-xs" : "text-sm"} ${getTextClasses(
                  "secondary"
                )} space-y-2`}
              >
                <div className="flex items-center gap-2">
                  <MapPin size={compact ? 12 : 14} />
                  <span>
                    {employee.branchCode} - {employee.branchName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={compact ? 12 : 14} />
                  <span>{employee.timestamp}</span>
                </div>
              </div>
              <button
                onClick={toggleMobileMenu}
                className={`mt-2 ${getTextClasses(
                  "secondary"
                )} flex items-center gap-1 ${compact ? "text-xs" : "text-sm"}`}
              >
                <X size={compact ? 12 : 14} />
                ปิด
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Spacer for floating header */}
      {floating && !transparent && (
        <div className={compact ? "h-16" : "h-20"}></div>
      )}
    </>
  );
};
