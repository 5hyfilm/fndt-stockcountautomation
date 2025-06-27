// src/hooks/useInventoryManager.tsx - แก้ไข conflict
"use client";

// Re-export everything from the inventory module
export {
  useInventoryManager,
  type InventoryItem,
  type InventorySummary,
  type EmployeeContext,
  type UseInventoryManagerReturn,
} from "./inventory/useInventoryManager";

// Additional exports for advanced usage - ✅ ลบ useInventoryExport ออกชั่วคราว
export {
  useInventoryStorage,
  useInventoryOperations,
  useInventorySummary,
  // useInventoryExport, // ✅ Comment ออกชั่วคราว
} from "./inventory";
