// src/app/page.tsx - Updated main app with error boundaries and better structure
"use client";

import React, { useState, useEffect } from "react";
import { Scanner } from "../components/Scanner";
import {
  ErrorBoundary,
  ScannerErrorBoundary,
} from "../components/ErrorBoundary";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { preloadProducts, getProductStats } from "../data/csvProducts";
import { Product } from "../types/product";

// Tab type
type TabType = "scanner" | "inventory" | "products" | "settings";

// Inventory item interface
interface InventoryItem {
  id: string;
  product: Product;
  barcodeType: "ea" | "dsp" | "cs";
  quantity: number;
  timestamp: string;
  scannedBarcode: string;
}

export default function Home() {
  // State management
  const [activeTab, setActiveTab] = useState<TabType>("scanner");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState<string | null>(null);
  const [productStats, setProductStats] = useState<any>(null);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        console.log("🚀 Initializing app...");

        // Preload products for better performance
        await preloadProducts();

        // Load product statistics
        const stats = await getProductStats();
        setProductStats(stats);

        // Load saved inventory from localStorage
        const savedInventory = localStorage.getItem("inventory");
        if (savedInventory) {
          try {
            const parsed = JSON.parse(savedInventory);
            setInventory(Array.isArray(parsed) ? parsed : []);
            console.log(
              `📋 Loaded ${parsed.length} inventory items from storage`
            );
          } catch (error) {
            console.warn("⚠️ Failed to parse saved inventory:", error);
            localStorage.removeItem("inventory");
          }
        }

        console.log("✅ App initialized successfully");
      } catch (error: any) {
        console.error("❌ Failed to initialize app:", error);
        setAppError(error.message || "ไม่สามารถเริ่มต้นแอปพลิเคชันได้");
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Save inventory to localStorage whenever it changes
  useEffect(() => {
    if (inventory.length > 0) {
      try {
        localStorage.setItem("inventory", JSON.stringify(inventory));
        console.log(`💾 Saved ${inventory.length} inventory items to storage`);
      } catch (error) {
        console.error("❌ Failed to save inventory:", error);
      }
    }
  }, [inventory]);

  // Handle product found from scanner
  const handleProductFound = (
    product: Product,
    barcodeType: "ea" | "dsp" | "cs"
  ) => {
    console.log("📦 Product found:", {
      product: product.name,
      type: barcodeType,
    });

    // Switch to inventory tab to show quantity input
    setActiveTab("inventory");

    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Add item to inventory
  const addInventoryItem = (
    product: Product,
    barcodeType: "ea" | "dsp" | "cs",
    quantity: number,
    scannedBarcode: string
  ) => {
    const newItem: InventoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      product,
      barcodeType,
      quantity,
      timestamp: new Date().toISOString(),
      scannedBarcode,
    };

    setInventory((prev) => [newItem, ...prev]);
    console.log(
      `✅ Added inventory item: ${product.name} x${quantity} (${barcodeType})`
    );
  };

  // Remove inventory item
  const removeInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
    console.log(`🗑️ Removed inventory item: ${id}`);
  };

  // Clear all inventory
  const clearInventory = () => {
    setInventory([]);
    localStorage.removeItem("inventory");
    console.log("🧹 Cleared all inventory");
  };

  // Export inventory
  const exportInventory = () => {
    if (inventory.length === 0) {
      alert("ไม่มีข้อมูลคลังสินค้าให้ส่งออก");
      return;
    }

    const csvContent = [
      "วันที่,เวลา,ชื่อสินค้า,รหัสสินค้า,บาร์โค้ด,ประเภท,จำนวน,หน่วย,แบรนด์",
      ...inventory.map((item) => {
        const date = new Date(item.timestamp);
        return [
          date.toLocaleDateString("th-TH"),
          date.toLocaleTimeString("th-TH"),
          `"${item.product.name}"`,
          item.product.sku,
          item.scannedBarcode,
          item.barcodeType.toUpperCase(),
          item.quantity,
          item.product.unit,
          item.product.brand,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    console.log("📤 Exported inventory to CSV");
  };

  // Get tab content
  const getTabContent = () => {
    switch (activeTab) {
      case "scanner":
        return (
          <ScannerErrorBoundary>
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  สแกนบาร์โค้ดสินค้า
                </h2>
                <p className="text-gray-600">
                  นำกล้องไปส่องที่บาร์โค้ดเพื่อค้นหาข้อมูลสินค้า
                </p>
              </div>

              <Scanner
                onProductFound={handleProductFound}
                showProductInfo={true}
                className="w-full"
              />
            </div>
          </ScannerErrorBoundary>
        );

      case "inventory":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                จัดการคลังสินค้า
              </h2>
              <div className="flex space-x-2">
                {inventory.length > 0 && (
                  <>
                    <button
                      onClick={exportInventory}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      ส่งออก CSV
                    </button>
                    <button
                      onClick={clearInventory}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                      onClick={() => {
                        if (
                          confirm("ต้องการลบข้อมูลคลังสินค้าทั้งหมดหรือไม่?")
                        ) {
                          clearInventory();
                        }
                      }}
                    >
                      ลบทั้งหมด
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Scanner for Inventory */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                สแกนเร็ว - เพิ่มสินค้าเข้าคลัง
              </h3>
              <ScannerErrorBoundary>
                <Scanner
                  onProductFound={(product, barcodeType) => {
                    // Auto add to inventory with quantity 1
                    const quantity = parseInt(
                      prompt("กรุณาใส่จำนวน:", "1") || "1"
                    );
                    if (quantity > 0) {
                      addInventoryItem(
                        product,
                        barcodeType,
                        quantity,
                        product.barcode
                      );
                    }
                  }}
                  showProductInfo={false}
                  className="h-64"
                />
              </ScannerErrorBoundary>
            </div>

            {/* Inventory List */}
            <div className="bg-white rounded-lg border border-gray-200">
              {inventory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    ยังไม่มีสินค้าในคลัง
                  </h3>
                  <p className="text-gray-500">
                    เริ่มสแกนบาร์โค้ดเพื่อเพิ่มสินค้าเข้าคลัง
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {item.product.name}
                          </h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>แบรนด์: {item.product.brand}</div>
                            <div>รหัส: {item.product.sku}</div>
                            <div>บาร์โค้ด: {item.scannedBarcode}</div>
                            <div>
                              ประเภท: {item.barcodeType.toUpperCase()}
                              <span className="ml-2 text-blue-600">
                                (
                                {item.barcodeType === "ea"
                                  ? "ชิ้น"
                                  : item.barcodeType === "dsp"
                                  ? "แพ็ค"
                                  : "ลัง"}
                                )
                              </span>
                            </div>
                            <div>
                              เพิ่มเมื่อ:{" "}
                              {new Date(item.timestamp).toLocaleString("th-TH")}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {item.quantity}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.product.unit}
                            </div>
                          </div>

                          <button
                            onClick={() => removeInventoryItem(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="ลบรายการ"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory Summary */}
            {inventory.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  สรุปคลังสินค้า
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {inventory.length}
                    </div>
                    <div className="text-sm text-gray-600">รายการ</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {inventory.reduce((sum, item) => sum + item.quantity, 0)}
                    </div>
                    <div className="text-sm text-gray-600">จำนวนรวม</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {
                        new Set(inventory.map((item) => item.product.brand))
                          .size
                      }
                    </div>
                    <div className="text-sm text-gray-600">แบรนด์</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {
                        new Set(inventory.map((item) => item.product.category))
                          .size
                      }
                    </div>
                    <div className="text-sm text-gray-600">หมวดหมู่</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "products":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">ข้อมูลสินค้า</h2>

            {productStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {productStats.totalProducts}
                  </div>
                  <div className="text-sm text-gray-600">สินค้าทั้งหมด</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {productStats.barcodeTypeCounts?.ea || 0}
                  </div>
                  <div className="text-sm text-gray-600">บาร์โค้ด EA</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {productStats.barcodeTypeCounts?.dsp || 0}
                  </div>
                  <div className="text-sm text-gray-600">บาร์โค้ด DSP</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {productStats.barcodeTypeCounts?.cs || 0}
                  </div>
                  <div className="text-sm text-gray-600">บาร์โค้ด CS</div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ข้อมูลการโหลด
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  สถานะ: {productStats?.csvLoaded ? "โหลดแล้ว" : "ยังไม่โหลด"}
                </div>
                <div>ดัชนีบาร์โค้ด: {productStats?.indexSize || 0} รายการ</div>
                <div>
                  หมวดหมู่:{" "}
                  {Object.keys(productStats?.categoryCounts || {}).length}
                </div>
                <div>
                  แบรนด์: {Object.keys(productStats?.brandCounts || {}).length}
                </div>
              </div>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">ตั้งค่า</h2>

            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  จัดการข้อมูล
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (confirm("ต้องการล้างคลังสินค้าทั้งหมดหรือไม่?")) {
                        clearInventory();
                        alert("ล้างข้อมูลคลังสินค้าเรียบร้อยแล้ว");
                      }
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    ล้างข้อมูลคลังสินค้าทั้งหมด
                  </button>

                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    รีเซ็ตแอปพลิเคชัน
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  ข้อมูลแอป
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>เวอร์ชัน: 2.0.0</div>
                  <div>ระบบสแกนบาร์โค้ด F&N</div>
                  <div>สนับสนุน: EAN-13, UPC-A, Code 128</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingIndicator
            isLoading={true}
            message="กำลังเริ่มต้นแอปพลิเคชัน..."
            size="lg"
          />
          <div className="mt-4 text-gray-600">กำลังโหลดข้อมูลสินค้า...</div>
        </div>
      </div>
    );
  }

  // Error screen
  if (appError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              ไม่สามารถเริ่มแอปได้
            </h1>
            <p className="text-gray-600 mb-6">{appError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-gray-800">
                  📱 ระบบสแกนบาร์โค้ด F&N
                </div>
                <div className="text-sm text-gray-500">
                  v2.0 | {inventory.length} รายการในคลัง
                </div>
              </div>

              {/* Tab Navigation */}
              <nav className="flex space-x-1">
                {[
                  { id: "scanner", label: "สแกน", icon: "📷" },
                  { id: "inventory", label: "คลัง", icon: "📦" },
                  { id: "products", label: "สินค้า", icon: "📋" },
                  { id: "settings", label: "ตั้งค่า", icon: "⚙️" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {getTabContent()}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center text-sm text-gray-500">
              ระบบสแกนบาร์โค้ดและจัดการคลังสินค้า F&N | พัฒนาด้วย Next.js และ
              Web Barcode API
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
