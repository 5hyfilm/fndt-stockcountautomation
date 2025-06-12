// src/components/inventory/InventoryHeader.tsx
"use client";

import React from "react";
import { BarChart3, Calendar, ChevronDown, ChevronUp } from "lucide-react";
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
      {/* Header Button - Always Visible */}
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
            <div className="text-sm text-gray-500 flex items-center gap-4">
              <span>{summary.totalProducts} รายการ</span>
              <span>•</span>
              <span>{summary.totalItems} ชิ้น</span>
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

      {/* Dropdown Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showSummary ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6">
          {/* Divider */}
          <div className="border-t border-gray-200 mb-4"></div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center border border-green-100 hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-fn-green mb-1">
                {summary.totalProducts.toLocaleString()}
              </div>
              <div className="text-sm text-green-700 font-medium">
                รายการสินค้า
              </div>
              <div className="text-xs text-green-600 mt-1">
                ผลิตภัณฑ์ทั้งหมด
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border border-blue-100 hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {summary.totalItems.toLocaleString()}
              </div>
              <div className="text-sm text-blue-700 font-medium">จำนวนรวม</div>
              <div className="text-xs text-blue-600 mt-1">ชิ้นทั้งหมด</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 text-center border border-purple-100 hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {Object.keys(summary.categories).length}
              </div>
              <div className="text-sm text-purple-700 font-medium">
                หมวดหมู่
              </div>
              <div className="text-xs text-purple-600 mt-1">ประเภทสินค้า</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 text-center border border-orange-100 hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {Object.keys(summary.brands).length}
              </div>
              <div className="text-sm text-orange-700 font-medium">แบรนด์</div>
              <div className="text-xs text-orange-600 mt-1">ยี่ห้อสินค้า</div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Categories */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                📂 หมวดหมู่ยอดนิยม
              </h4>
              <div className="space-y-2">
                {Object.entries(summary.categories)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm text-gray-700">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-fn-green h-2 rounded-full"
                            style={{
                              width: `${
                                (count /
                                  Math.max(
                                    ...Object.values(summary.categories)
                                  )) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-[30px] text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Brands */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                🏷️ แบรนด์ยอดนิยม
              </h4>
              <div className="space-y-2">
                {Object.entries(summary.brands)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([brand, count]) => (
                    <div
                      key={brand}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm text-gray-700">{brand}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{
                              width: `${
                                (count /
                                  Math.max(...Object.values(summary.brands))) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-[30px] text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          {summary.lastUpdate && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <Calendar size={12} />
                อัพเดตล่าสุด: {formatDate(summary.lastUpdate)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
