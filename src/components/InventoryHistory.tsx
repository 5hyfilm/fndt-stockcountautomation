// src/components/InventoryHistory.tsx
"use client";

import React, { useState } from "react";
import {
  History,
  Package,
  Clock,
  Trash2,
  AlertTriangle,
  FileText,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { InventoryItem, InventorySession } from "../types/inventory";
import { useInventory } from "../hooks/useInventory";

interface InventoryHistoryProps {
  maxItems?: number;
  showFilters?: boolean;
  showSession?: boolean;
}

export const InventoryHistory: React.FC<InventoryHistoryProps> = ({
  maxItems = 10,
  showFilters = true,
  showSession = true,
}) => {
  const {
    inventoryItems,
    currentSession,
    sessions,
    deleteInventoryItem,
    updateItemCondition,
    exportData,
    getInventorySummary,
  } = useInventory();

  const [showAllItems, setShowAllItems] = useState(false);
  const [filterCondition, setFilterCondition] = useState<string>("all");
  const [filterSession, setFilterSession] = useState<string>("all");
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  // Filter items
  const filteredItems = inventoryItems
    .filter((item) => {
      if (filterCondition !== "all" && item.condition !== filterCondition) {
        return false;
      }
      if (filterSession !== "all" && item.session !== filterSession) {
        return false;
      }
      return true;
    })
    .slice(0, showAllItems ? undefined : maxItems);

  const summary = getInventorySummary();

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "เมื่อสักครู่";
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    return `${diffDays} วันที่แล้ว`;
  };

  const getConditionColor = (condition: InventoryItem["condition"]) => {
    switch (condition) {
      case "good":
        return "text-green-600 bg-green-50 border-green-200";
      case "damaged":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "expired":
        return "text-red-600 bg-red-50 border-red-200";
      case "returned":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getConditionLabel = (condition: InventoryItem["condition"]) => {
    switch (condition) {
      case "good":
        return "ปกติ";
      case "damaged":
        return "เสียหาย";
      case "expired":
        return "หมดอายุ";
      case "returned":
        return "คืนสินค้า";
      default:
        return condition;
    }
  };

  if (inventoryItems.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="text-center py-8">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <History className="text-gray-500" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ยังไม่มีประวัติการสแกน
          </h3>
          <p className="text-gray-500 text-sm">
            เมื่อสแกนสินค้าและบันทึกจำนวนแล้ว ประวัติจะแสดงที่นี่
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-semibold">ประวัติการสแกน</h3>
              <p className="text-purple-100 text-sm">
                {summary.totalItems} รายการ | {summary.totalQuantity} ชิ้น
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportData}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-lg transition-colors"
              title="ส่งออกข้อมูล"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Current Session Info */}
        {showSession && currentSession && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-blue-600" size={16} />
                <span className="font-medium text-blue-800">
                  เซชันปัจจุบัน: {currentSession.name}
                </span>
              </div>
              <button
                onClick={() => setShowSessionDetails(!showSessionDetails)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showSessionDetails ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            </div>

            {showSessionDetails && (
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  เริ่มเมื่อ:{" "}
                  {new Date(currentSession.startedAt).toLocaleString("th-TH")}
                </p>
                <p>
                  รายการ: {currentSession.totalItems} | จำนวน:{" "}
                  {currentSession.totalQuantity}
                </p>
                {currentSession.description && (
                  <p>รายละเอียด: {currentSession.description}</p>
                )}
                {currentSession.location && (
                  <p>สถานที่: {currentSession.location}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">ตัวกรอง</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  สภาพสินค้า:
                </label>
                <select
                  value={filterCondition}
                  onChange={(e) => setFilterCondition(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="good">ปกติ</option>
                  <option value="damaged">เสียหาย</option>
                  <option value="expired">หมดอายุ</option>
                  <option value="returned">คืนสินค้า</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  เซชัน:
                </label>
                <select
                  value={filterSession}
                  onChange={(e) => setFilterSession(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">ทั้งหมด</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-3">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Package
                      size={16}
                      className="text-blue-500 flex-shrink-0"
                    />
                    <h4 className="font-medium text-gray-900 truncate">
                      {item.product.name}
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${getConditionColor(
                        item.condition
                      )}`}
                    >
                      {getConditionLabel(item.condition)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">จำนวน:</span>
                      <span className="text-gray-900">
                        {item.quantity} {item.unitLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{formatTimeAgo(item.scannedAt)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {item.barcode}
                      </span>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-100 rounded p-2">
                      <FileText size={12} className="inline mr-1" />
                      {item.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Condition Selector */}
                  <select
                    value={item.condition}
                    onChange={(e) =>
                      updateItemCondition(
                        item.id,
                        e.target.value as InventoryItem["condition"]
                      )
                    }
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="good">ปกติ</option>
                    <option value="damaged">เสียหาย</option>
                    <option value="expired">หมดอายุ</option>
                    <option value="returned">คืนสินค้า</option>
                  </select>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `ต้องการลบรายการ "${item.product.name}" หรือไม่?`
                        )
                      ) {
                        deleteInventoryItem(item.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    title="ลบรายการ"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show More Button */}
        {inventoryItems.length > maxItems && (
          <div className="text-center">
            <button
              onClick={() => setShowAllItems(!showAllItems)}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1 mx-auto"
            >
              {showAllItems ? (
                <>
                  <ChevronUp size={16} />
                  แสดงน้อยลง
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  แสดงทั้งหมด ({inventoryItems.length - maxItems} รายการ)
                </>
              )}
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-purple-600">
                {summary.todayStats.items}
              </div>
              <div className="text-xs text-gray-600">วันนี้</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {summary.totalItems}
              </div>
              <div className="text-xs text-gray-600">ทั้งหมด</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {summary.totalQuantity}
              </div>
              <div className="text-xs text-gray-600">จำนวนรวม</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">
                {summary.totalSessions}
              </div>
              <div className="text-xs text-gray-600">เซชัน</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
