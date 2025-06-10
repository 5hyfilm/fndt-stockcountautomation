// src/components/RecentActivity.tsx
"use client";

import React from "react";
import { Clock, Package, Plus, Minus, Trash2, Scan } from "lucide-react";
import { InventoryItem } from "../hooks/useInventoryManager";

interface RecentActivityProps {
  inventory: InventoryItem[];
  lastScannedBarcode?: string;
  limit?: number;
}

interface ActivityItem {
  id: string;
  type: "add" | "scan" | "update";
  productName: string;
  barcode: string;
  quantity?: number;
  timestamp: string;
  brand: string;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  inventory,
  lastScannedBarcode,
  limit = 5,
}) => {
  // สร้างรายการกิจกรรมล่าสุด
  const recentActivities = React.useMemo(() => {
    const activities: ActivityItem[] = [];

    // เพิ่มกิจกรรมจาก inventory (เรียงตามเวลา)
    inventory
      .sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      )
      .slice(0, limit)
      .forEach((item) => {
        activities.push({
          id: item.id,
          type: "add",
          productName: item.productName,
          barcode: item.barcode,
          quantity: item.quantity,
          timestamp: item.lastUpdated,
          brand: item.brand,
        });
      });

    // เพิ่มกิจกรรมการสแกนล่าสุด
    if (lastScannedBarcode) {
      const scannedItem = inventory.find(
        (item) => item.barcode === lastScannedBarcode
      );
      if (scannedItem) {
        activities.unshift({
          id: `scan_${lastScannedBarcode}`,
          type: "scan",
          productName: scannedItem.productName,
          barcode: lastScannedBarcode,
          timestamp: new Date().toISOString(),
          brand: scannedItem.brand,
        });
      }
    }

    // เรียงตามเวลาและจำกัดจำนวน
    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  }, [inventory, lastScannedBarcode, limit]);

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "เมื่อสักครู่";
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

    return time.toLocaleDateString("th-TH", {
      month: "short",
      day: "numeric",
    });
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "scan":
        return <Scan className="text-blue-500" size={16} />;
      case "add":
        return <Plus className="text-green-500" size={16} />;
      case "update":
        return <Package className="text-orange-500" size={16} />;
      default:
        return <Package className="text-gray-500" size={16} />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "scan":
        return "สแกนสินค้า";
      case "add":
        return `เพิ่มเข้า Stock (${activity.quantity} ชิ้น)`;
      case "update":
        return `อัพเดตจำนวน (${activity.quantity} ชิ้น)`;
      default:
        return "กิจกรรม";
    }
  };

  const getActivityColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "scan":
        return "bg-blue-50 border-blue-200";
      case "add":
        return "bg-green-50 border-green-200";
      case "update":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (recentActivities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="text-gray-500" size={16} />
          <h3 className="text-sm font-medium text-gray-700">กิจกรรมล่าสุด</h3>
        </div>
        <div className="text-center py-4">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">ยังไม่มีกิจกรรม</p>
          <p className="text-gray-400 text-xs">เริ่มสแกนสินค้าเพื่อดูกิจกรรม</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="text-gray-500" size={16} />
        <h3 className="text-sm font-medium text-gray-700">กิจกรรมล่าสุด</h3>
      </div>

      <div className="space-y-3">
        {recentActivities.map((activity) => (
          <div
            key={activity.id}
            className={`p-3 rounded-lg border transition-colors hover:bg-gray-50 ${getActivityColor(
              activity.type
            )}`}
          >
            <div className="flex items-start gap-3">
              <div className="bg-white rounded-full p-1 border border-gray-200 shadow-sm">
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.productName}
                  </p>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>{getActivityText(activity)}</span>
                  <span>•</span>
                  <span className="font-medium">{activity.brand}</span>
                </div>

                <div className="mt-1">
                  <code className="text-xs text-gray-500 bg-white/70 px-1 py-0.5 rounded">
                    {activity.barcode}
                  </code>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {inventory.length > limit && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            แสดง {recentActivities.length} จาก {inventory.length} กิจกรรม
          </p>
        </div>
      )}
    </div>
  );
};
