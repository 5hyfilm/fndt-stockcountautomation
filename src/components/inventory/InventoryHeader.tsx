// src/components/inventory/InventoryHeader.tsx - Updated with Dual Unit Support
"use client";

import React from "react";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Package2,
  Box,
  ShoppingCart,
} from "lucide-react";
import { InventorySummary } from "../../hooks/useInventoryManager";

interface InventoryHeaderProps {
  summary: InventorySummary;
  showSummary: boolean;
  onToggleSummary: (show: boolean) => void;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  summary,
  showSummary,
  onToggleSummary,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header Button - Always Visible with Dual Unit Summary */}
      <button
        onClick={() => onToggleSummary(!showSummary)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-fn-green to-fn-red p-2 rounded-lg">
            <BarChart3 className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-fn-green transition-colors">
              สรุป Inventory
            </h3>
            {/* ✅ Updated Summary - Dual Unit Format */}
            <div className="text-sm text-gray-500 flex items-center gap-4">
              <span>{summary.totalProducts} รายการ</span>
              <span>•</span>
              <span>{summary.totalCSUnits || 0} ลัง</span>
              <span>•</span>
              <span>{summary.totalDSPUnits || 0} แพ็ค</span>
              <span>•</span>
              <span>{summary.totalPieces || 0} ชิ้น</span>
              <span>•</span>
              <span>{Object.keys(summary.categories).length} หมวดหมู่</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right text-sm text-gray-500">
            {showSummary ? "ซ่อนรายละเอียด" : "แสดงรายละเอียด"}
          </div>
          <div className="p-1 rounded-full bg-gray-100 group-hover:bg-fn-green/10 transition-colors">
            {showSummary ? (
              <ChevronUp
                size={16}
                className="text-gray-600 group-hover:text-fn-green transition-colors"
              />
            ) : (
              <ChevronDown
                size={16}
                className="text-gray-600 group-hover:text-fn-green transition-colors"
              />
            )}
          </div>
        </div>
      </button>

      {/* Dropdown Content - Enhanced with Dual Unit Details */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showSummary ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6 pt-2 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ✅ Dual Unit Statistics */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Package2 className="text-fn-green" size={16} />
                สถิติหน่วยนับ
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">ลัง (CS)</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {summary.totalCSUnits || 0} ลัง
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">แพ็ค (DSP)</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {summary.totalDSPUnits || 0} แพ็ค
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">ชิ้น/เศษ (EA)</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {summary.totalPieces || 0} ชิ้น
                  </span>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Box className="text-fn-orange" size={16} />
                จำแนกตามหมวดหมู่
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Object.entries(summary.categories)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                    >
                      <span className="text-sm text-gray-600 truncate">
                        {category}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {count}
                      </span>
                    </div>
                  ))}
                {Object.keys(summary.categories).length > 5 && (
                  <div className="text-xs text-gray-500 text-center pt-1">
                    และอีก {Object.keys(summary.categories).length - 5} หมวดหมู่
                  </div>
                )}
              </div>
            </div>

            {/* Brand Breakdown */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ShoppingCart className="text-fn-red" size={16} />
                จำแนกตามแบรนด์
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Object.entries(summary.brands)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([brand, count]) => (
                    <div
                      key={brand}
                      className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                    >
                      <span className="text-sm text-gray-600 truncate">
                        {brand}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {count}
                      </span>
                    </div>
                  ))}
                {Object.keys(summary.brands).length > 5 && (
                  <div className="text-xs text-gray-500 text-center pt-1">
                    และอีก {Object.keys(summary.brands).length - 5} แบรนด์
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Last Update */}
          {summary.lastUpdate && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={14} />
                <span>อัปเดตล่าสุด: {formatDate(summary.lastUpdate)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
