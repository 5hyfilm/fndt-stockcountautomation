// src/components/InventoryStats.tsx
"use client";

import React from "react";
import {
  BarChart3,
  Package,
  TrendingUp,
  Calendar,
  Award,
  Star,
} from "lucide-react";
import { InventorySummary } from "../hooks/inventory/types";

interface InventoryStatsProps {
  summary: InventorySummary;
  isCompact?: boolean;
}

export const InventoryStats: React.FC<InventoryStatsProps> = ({
  summary,
  isCompact = false,
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "ยังไม่มีข้อมูล";
    return new Date(dateString).toLocaleDateString("th-TH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // หาหมวดหมู่ที่มีสินค้ามากที่สุด
  const topCategory = React.useMemo(() => {
    const categories = Object.entries(summary.categories);
    if (categories.length === 0) return null;

    return categories.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );
  }, [summary.categories]);

  // หาแบรนด์ที่มีสินค้ามากที่สุด
  const topBrand = React.useMemo(() => {
    const brands = Object.entries(summary.brands);
    if (brands.length === 0) return null;

    return brands.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );
  }, [summary.brands]);

  // ✅ FIXED: Safe access to quantityBreakdown with default values
  const quantityBreakdown = summary.quantityBreakdown || {
    totalCS: 0,
    totalDSP: 0,
    totalEA: 0,
    itemsWithMultipleUnits: 0,
  };

  if (isCompact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="fn-green" size={16} />
          <span className="text-sm font-medium text-gray-700">
            Stock Summary
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold fn-green">
              {summary.totalProducts}
            </div>
            <div className="text-xs text-gray-600">รายการ</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {summary.totalItems}
            </div>
            <div className="text-xs text-gray-600">ชิ้น</div>
          </div>
        </div>

        {summary.lastUpdate && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            อัพเดต: {formatDate(summary.lastUpdate)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="fn-green" size={20} />
        <h3 className="text-lg font-semibold text-gray-900">สถิติ Inventory</h3>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-fn-green/10 rounded-lg p-3 text-center border border-fn-green/20">
          <Package className="fn-green mx-auto mb-1" size={20} />
          <div className="text-2xl font-bold fn-green">
            {summary.totalProducts}
          </div>
          <div className="text-sm text-gray-600">รายการสินค้า</div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
          <TrendingUp className="text-blue-600 mx-auto mb-1" size={20} />
          <div className="text-2xl font-bold text-blue-600">
            {summary.totalItems}
          </div>
          <div className="text-sm text-gray-600">จำนวนรวม</div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
          <Award className="text-purple-600 mx-auto mb-1" size={20} />
          <div className="text-2xl font-bold text-purple-600">
            {Object.keys(summary.categories).length}
          </div>
          <div className="text-sm text-gray-600">หมวดหมู่</div>
        </div>

        <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
          <Star className="text-orange-600 mx-auto mb-1" size={20} />
          <div className="text-2xl font-bold text-orange-600">
            {Object.keys(summary.brands).length}
          </div>
          <div className="text-sm text-gray-600">แบรนด์</div>
        </div>
      </div>

      {/* ✅ NEW: Multi-unit quantity breakdown (if available) */}
      {quantityBreakdown &&
        (quantityBreakdown.totalCS > 0 ||
          quantityBreakdown.totalDSP > 0 ||
          quantityBreakdown.totalEA > 0) && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              แยกตามหน่วยนับ
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {quantityBreakdown.totalCS}
                </div>
                <div className="text-xs text-gray-600">ลัง (CS)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {quantityBreakdown.totalDSP}
                </div>
                <div className="text-xs text-gray-600">แพ็ค (DSP)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {quantityBreakdown.totalEA}
                </div>
                <div className="text-xs text-gray-600">ชิ้น (EA)</div>
              </div>
            </div>
            {quantityBreakdown.itemsWithMultipleUnits > 0 && (
              <div className="mt-2 text-xs text-gray-600 text-center">
                มี {quantityBreakdown.itemsWithMultipleUnits}{" "}
                รายการที่มีหลายหน่วย
              </div>
            )}
          </div>
        )}

      {/* Top Categories and Brands */}
      {(topCategory || topBrand) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {topCategory && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                หมวดหมู่ที่มีสินค้ามากที่สุด
              </h4>
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">
                  {topCategory[0]}
                </span>
                <span className="text-fn-green font-bold">
                  {topCategory[1]} รายการ
                </span>
              </div>
            </div>
          )}

          {topBrand && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                แบรนด์ที่มีสินค้ามากที่สุด
              </h4>
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">{topBrand[0]}</span>
                <span className="text-blue-600 font-bold">
                  {topBrand[1]} รายการ
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Categories Breakdown */}
      {Object.keys(summary.categories).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            จำนวนสินค้าแยกตามหมวดหมู่
          </h4>
          <div className="space-y-2">
            {Object.entries(summary.categories)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([category, count]) => (
                <div
                  key={category}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-700">{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-fn-green/20 rounded-full h-2 flex-1 min-w-[50px] overflow-hidden">
                      <div
                        className="bg-fn-green h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (count / summary.totalProducts) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 min-w-[40px] text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Last Update */}
      {summary.lastUpdate && (
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-2">
          <Calendar size={14} />
          <span>อัพเดตล่าสุด: {formatDate(summary.lastUpdate)}</span>
        </div>
      )}
    </div>
  );
};
