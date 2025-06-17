// src/components/stats/QuickStats.tsx - Updated with Dual Unit Support

"use client";

import React from "react";
import {
  Package,
  ShoppingCart,
  Package2,
  Box,
  BarChart3,
  Clock,
} from "lucide-react";

interface QuickStatsProps {
  totalItems: number;
  totalProducts: number;
  totalCSUnits: number; // ✅ NEW
  totalDSPUnits: number; // ✅ NEW
  totalPieces: number; // ✅ NEW
  lastUpdate: string;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  totalItems,
  totalProducts,
  totalCSUnits,
  totalDSPUnits,
  totalPieces,
  lastUpdate,
}) => {
  // Format last update time
  const formatLastUpdate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return "เมื่อสักครู่";
      if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
      if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
      if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "ไม่ทราบ";
    }
  };

  const statsData = [
    {
      icon: <ShoppingCart className="text-blue-600" size={20} />,
      label: "รายการทั้งหมด",
      value: totalItems.toLocaleString(),
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
    },
    {
      icon: <Package className="text-green-600" size={20} />,
      label: "สินค้าแตกต่าง",
      value: totalProducts.toLocaleString(),
      bgColor: "bg-green-50",
      iconBg: "bg-green-100",
    },
    {
      icon: <Package2 className="text-purple-600" size={20} />,
      label: "หน่วยใหญ่ (CS/DSP)",
      value: totalCSUnits.toLocaleString(),
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100",
      description: `DSP: ${totalDSPUnits.toLocaleString()}`,
    },
    {
      icon: <Box className="text-orange-600" size={20} />,
      label: "ชิ้น/เศษ",
      value: totalPieces.toLocaleString(),
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-fn-green/10 p-2 rounded-lg">
          <BarChart3 className="text-fn-green" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">สถิติด่วน</h3>
          <p className="text-sm text-gray-600">ข้อมูลสรุป Inventory</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} rounded-lg p-4 border border-gray-100`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`${stat.iconBg} p-2 rounded-lg`}>{stat.icon}</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </div>
            <div className="text-sm font-medium text-gray-700 mb-1">
              {stat.label}
            </div>
            {stat.description && (
              <div className="text-xs text-gray-500">{stat.description}</div>
            )}
          </div>
        ))}
      </div>

      {/* Last Update */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
        <Clock size={16} />
        <span>อัพเดตล่าสุด: {formatLastUpdate(lastUpdate)}</span>
      </div>

      {/* Additional Dual Unit Breakdown */}
      {(totalCSUnits > 0 || totalPieces > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            รายละเอียดหน่วย
          </h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-purple-700 font-medium">หน่วยใหญ่</div>
              <div className="text-purple-900 text-sm">
                CS: {(totalCSUnits - totalDSPUnits).toLocaleString()}
              </div>
              <div className="text-purple-900 text-sm">
                DSP: {totalDSPUnits.toLocaleString()}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-orange-700 font-medium">หน่วยเล็ก</div>
              <div className="text-orange-900 text-sm">
                ชิ้น/เศษ: {totalPieces.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
