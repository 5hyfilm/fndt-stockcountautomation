// src/components/inventory/InventoryHeader.tsx
"use client";

import React from "react";
import { BarChart3, Calendar, X } from "lucide-react";
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

  if (!showSummary) return null;

  return (
    <div className="bg-gradient-to-r from-fn-green/10 to-fn-red/10 border border-fn-green/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="fn-green" size={20} />
          สรุป Inventory
        </h3>
        <button
          onClick={() => onToggleSummary(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <div className="text-2xl font-bold fn-green">
            {summary.totalProducts}
          </div>
          <div className="text-sm text-gray-600">รายการสินค้า</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {summary.totalItems}
          </div>
          <div className="text-sm text-gray-600">จำนวนรวม</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {Object.keys(summary.categories).length}
          </div>
          <div className="text-sm text-gray-600">หมวดหมู่</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {Object.keys(summary.brands).length}
          </div>
          <div className="text-sm text-gray-600">แบรนด์</div>
        </div>
      </div>

      {summary.lastUpdate && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Calendar size={12} />
          อัพเดตล่าสุด: {formatDate(summary.lastUpdate)}
        </div>
      )}
    </div>
  );
};
