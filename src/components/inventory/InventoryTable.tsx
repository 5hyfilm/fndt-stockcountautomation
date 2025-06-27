// Path: src/components/inventory/InventoryTable.tsx
// New table view component for displaying grouped inventory

"use client";

import React from "react";
import { Package, Archive, Package2 } from "lucide-react";
import {
  GroupedInventoryItem,
  InventoryOperationResult,
} from "../../hooks/inventory/types";
import { BarcodeType } from "../../types/product";
import { InventoryTableItem } from "./InventoryTableItem";

interface InventoryTableProps {
  groupedItems: GroupedInventoryItem[];
  totalProducts: number;
  totalRecords: number;
  onUpdateQuantity: (
    baseProductId: string,
    barcodeType: BarcodeType,
    newQuantity: number
  ) => InventoryOperationResult;
  onRemoveProduct: (baseProductId: string) => InventoryOperationResult;
  isLoading?: boolean;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  groupedItems,
  totalProducts,
  totalRecords,
  onUpdateQuantity,
  onRemoveProduct,
  isLoading = false,
}) => {
  // ✅ Empty state
  if (groupedItems.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          ไม่มีรายการสินค้า
        </h3>
        <p className="text-gray-500">
          เริ่มต้นการนับสต็อกด้วยการสแกนบาร์โค้ดสินค้า
        </p>
      </div>
    );
  }

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="h-12 bg-gray-100"></div>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 border-b border-gray-200 bg-gray-50"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ✅ Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          รายการสินค้า ({groupedItems.length} สินค้า, {totalRecords} records)
        </h2>

        {/* ✅ Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Archive size={14} />
            <span>CS = ลัง</span>
          </div>
          <div className="flex items-center gap-1">
            <Package size={14} />
            <span>DSP = แพ็ค</span>
          </div>
          <div className="flex items-center gap-1">
            <Package2 size={14} />
            <span>EA = ชิ้น</span>
          </div>
        </div>
      </div>

      {/* ✅ Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* ✅ Table Header */}
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สินค้า
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                  <div className="flex items-center justify-center gap-1">
                    <Archive size={14} />
                    CS
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                  <div className="flex items-center justify-center gap-1">
                    <Package size={14} />
                    DSP
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                  <div className="flex items-center justify-center gap-1">
                    <Package2 size={14} />
                    EA
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                  การจัดการ
                </th>
              </tr>
            </thead>

            {/* ✅ Table Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {groupedItems.map((groupedItem) => (
                <InventoryTableItem
                  key={groupedItem.baseProductId}
                  groupedItem={groupedItem}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemoveProduct={onRemoveProduct}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* ✅ Table Footer with Summary */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>รวมทั้งหมด: {groupedItems.length} สินค้า</span>

            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1">
                <Archive size={14} />
                CS:{" "}
                {groupedItems.reduce(
                  (sum, item) => sum + item.csQuantity,
                  0
                )}{" "}
                ลัง
              </span>
              <span className="flex items-center gap-1">
                <Package size={14} />
                DSP:{" "}
                {groupedItems.reduce(
                  (sum, item) => sum + item.dspQuantity,
                  0
                )}{" "}
                แพ็ค
              </span>
              <span className="flex items-center gap-1">
                <Package2 size={14} />
                EA:{" "}
                {groupedItems.reduce(
                  (sum, item) => sum + item.eaQuantity,
                  0
                )}{" "}
                ชิ้น
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Additional Info */}
      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Package2 size={14} className="text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 mb-1">วิธีใช้งาน:</p>
            <ul className="space-y-1 text-blue-700">
              <li>
                • คลิก{" "}
                <span className="inline-flex items-center gap-1">
                  <Archive size={10} /> <Package size={10} />{" "}
                  <Package2 size={10} />
                </span>{" "}
                ในแต่ละช่องเพื่อแก้ไขจำนวน
              </li>
              <li>• การลบจะเป็นการลบสินค้าทั้งหมด (CS + DSP + EA)</li>
              <li>• แต่ละบาร์โค้ดจะเพิ่มเฉพาะหน่วยที่สแกน</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
