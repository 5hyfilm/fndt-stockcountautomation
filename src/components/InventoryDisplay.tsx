// src/components/InventoryDisplay.tsx
"use client";

import React, { useState } from "react";
import {
  Package,
  Search,
  Edit3,
  Trash2,
  Plus,
  Minus,
  Download,
  RefreshCw,
  Archive,
  AlertTriangle,
  CheckCircle,
  Filter,
  X,
  Eye,
  Calendar,
  BarChart3,
} from "lucide-react";
import { InventoryItem, InventorySummary } from "../hooks/useInventoryManager";

interface InventoryDisplayProps {
  inventory: InventoryItem[];
  summary: InventorySummary;
  isLoading: boolean;
  error: string | null;
  onUpdateQuantity: (itemId: string, newQuantity: number) => boolean;
  onRemoveItem: (itemId: string) => boolean;
  onClearInventory: () => boolean;
  onExportInventory: () => boolean;
  onClearError: () => void;
  onSearch: (searchTerm: string) => InventoryItem[];
}

export const InventoryDisplay: React.FC<InventoryDisplayProps> = ({
  inventory,
  summary,
  isLoading,
  error,
  onUpdateQuantity,
  onRemoveItem,
  onClearInventory,
  onExportInventory,
  onClearError,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [showSummary, setShowSummary] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "quantity" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter และ sort inventory
  const filteredAndSortedInventory = React.useMemo(() => {
    let filtered = inventory;

    // Filter by search term
    if (searchTerm) {
      filtered = onSearch(searchTerm);
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by brand
    if (selectedBrand !== "all") {
      filtered = filtered.filter((item) => item.brand === selectedBrand);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.productName.localeCompare(b.productName);
          break;
        case "quantity":
          comparison = a.quantity - b.quantity;
          break;
        case "date":
          comparison =
            new Date(a.lastUpdated).getTime() -
            new Date(b.lastUpdated).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    inventory,
    searchTerm,
    selectedCategory,
    selectedBrand,
    sortBy,
    sortOrder,
    onSearch,
  ]);

  // Get unique categories and brands for filters
  const categories = React.useMemo(
    () => [...new Set(inventory.map((item) => item.category))].sort(),
    [inventory]
  );

  const brands = React.useMemo(
    () => [...new Set(inventory.map((item) => item.brand))].sort(),
    [inventory]
  );

  const handleEditStart = (item: InventoryItem) => {
    setEditingItem(item.id);
    setEditQuantity(item.quantity);
  };

  const handleEditSave = (itemId: string) => {
    const success = onUpdateQuantity(itemId, editQuantity);
    if (success) {
      setEditingItem(null);
    }
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditQuantity(0);
  };

  const handleQuickAdjust = (
    itemId: string,
    currentQuantity: number,
    delta: number
  ) => {
    const newQuantity = Math.max(0, currentQuantity + delta);
    onUpdateQuantity(itemId, newQuantity);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedBrand("all");
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="text-center py-8">
          <RefreshCw className="animate-spin w-8 h-8 text-fn-green mx-auto mb-3" />
          <p className="text-gray-600">กำลังโหลดข้อมูล inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={onClearError}
            className="text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary Card */}
      {showSummary && (
        <div className="bg-gradient-to-r from-fn-green/10 to-fn-red/10 border border-fn-green/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="fn-green" size={20} />
              สรุป Inventory
            </h3>
            <button
              onClick={() => setShowSummary(false)}
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
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาสินค้า, แบรนด์, หรือบาร์โค้ด..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fn-green focus:border-fn-green"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onExportInventory}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
            >
              <Download size={16} />
              ส่งออก
            </button>

            <button
              onClick={() => setShowConfirmClear(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
              disabled={inventory.length === 0}
            >
              <Trash2 size={16} />
              ลบทั้งหมด
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">กรอง:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">หมวดหมู่ทั้งหมด</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">แบรนด์ทั้งหมด</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split("-");
              setSortBy(sort as any);
              setSortOrder(order as any);
            }}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="date-desc">วันที่ใหม่สุด</option>
            <option value="date-asc">วันที่เก่าสุด</option>
            <option value="name-asc">ชื่อ A-Z</option>
            <option value="name-desc">ชื่อ Z-A</option>
            <option value="quantity-desc">จำนวนมากสุด</option>
            <option value="quantity-asc">จำนวนน้อยสุด</option>
          </select>

          {(searchTerm ||
            selectedCategory !== "all" ||
            selectedBrand !== "all") && (
            <button
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
            >
              <X size={14} />
              ล้างตัวกรอง
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          แสดง {filteredAndSortedInventory.length} จาก {inventory.length} รายการ
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredAndSortedInventory.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-lg mb-2">
              {inventory.length === 0
                ? "ยังไม่มีสินค้าใน inventory"
                : "ไม่พบสินค้าที่ตรงกับเงื่อนไข"}
            </p>
            <p className="text-gray-500 text-sm">
              {inventory.length === 0
                ? "เริ่มสแกนบาร์โค้ดเพื่อเพิ่มสินค้า"
                : "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedInventory.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-fn-green/10 p-2 rounded-lg">
                        <Package className="fn-green" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.productName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="fn-green font-medium">
                            {item.brand}
                          </span>
                          <span>•</span>
                          <span>{item.category}</span>
                          <span>•</span>
                          <span>
                            {item.size} {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>บาร์โค้ด: {item.barcode}</span>
                      <span>อัพเดต: {formatDate(item.lastUpdated)}</span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 ml-4">
                    {editingItem === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editQuantity}
                          onChange={(e) =>
                            setEditQuantity(parseInt(e.target.value) || 0)
                          }
                          min="0"
                          max="9999"
                          className="w-16 text-center py-1 border border-gray-300 rounded"
                        />
                        <button
                          onClick={() => handleEditSave(item.id)}
                          className="text-green-600 hover:text-green-700 p-1"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="text-gray-500 hover:text-gray-700 p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleQuickAdjust(item.id, item.quantity, -1)
                            }
                            disabled={item.quantity <= 0}
                            className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 p-1 rounded"
                          >
                            <Minus size={14} />
                          </button>

                          <div className="min-w-[60px] text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              {item.quantity}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.unit || "ชิ้น"}
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              handleQuickAdjust(item.id, item.quantity, 1)
                            }
                            className="bg-gray-100 hover:bg-gray-200 p-1 rounded"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          onClick={() => handleEditStart(item)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="แก้ไขจำนวน"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="ลบรายการ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Clear Dialog */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-500" size={24} />
              <h3 className="text-lg font-semibold">ยืนยันการลบข้อมูล</h3>
            </div>
            <p className="text-gray-600 mb-6">
              คุณต้องการลบข้อมูล inventory ทั้งหมด ({inventory.length} รายการ)
              ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onClearInventory();
                  setShowConfirmClear(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                ลบทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
