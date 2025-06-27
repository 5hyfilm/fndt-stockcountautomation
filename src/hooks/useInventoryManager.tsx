// Path: ./src/hooks/useInventoryManager.tsx
"use client";

// Re-export everything from the inventory module
export {
  useInventoryManager,
  type InventoryItem,
  type InventorySummary,
  type EmployeeContext,
  type UseInventoryManagerReturn,
} from "./inventory/useInventoryManager";

// Additional exports for advanced usage - ✅ เปิดใช้งาน useInventoryExport อีกครั้ง
export {
  useInventoryStorage,
  useInventoryOperations,
  useInventorySummary,
  useInventoryExport, // ✅ เปิดใช้งานอีกครั้งหลังจากแก้ conflict แล้ว
} from "./inventory";
