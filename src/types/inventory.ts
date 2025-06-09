// src/types/inventory.ts
import { Product } from "./product";

export interface InventoryItem {
  id: string;
  product: Product;
  barcode: string;
  quantity: number;
  unit: "ea" | "dsp" | "cs"; // Each, Display Pack, Case
  unitLabel: string;
  notes?: string;
  scannedAt: string;
  location?: string;
  batchNumber?: string;
  expiryDate?: string;
  condition: "good" | "damaged" | "expired" | "returned";
  scannedBy?: string;
  session?: string; // ระบุ session การสแกน
}

export interface InventorySession {
  id: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  totalItems: number;
  totalQuantity: number;
  status: "active" | "completed" | "cancelled";
  description?: string;
  location?: string;
}

export interface InventorySummary {
  totalSessions: number;
  totalItems: number;
  totalQuantity: number;
  lastScanTime?: string;
  topProducts: Array<{
    product: Product;
    totalQuantity: number;
    scanCount: number;
  }>;
  todayStats: {
    items: number;
    quantity: number;
    sessions: number;
  };
}

export interface InventoryFilter {
  dateFrom?: string;
  dateTo?: string;
  productName?: string;
  barcode?: string;
  session?: string;
  condition?: InventoryItem["condition"];
  unit?: InventoryItem["unit"];
}

// API Response types
export interface SaveInventoryResponse {
  success: boolean;
  data?: InventoryItem;
  error?: string;
}

export interface InventoryListResponse {
  success: boolean;
  data?: InventoryItem[];
  total?: number;
  summary?: InventorySummary;
  error?: string;
}

export interface InventorySessionResponse {
  success: boolean;
  data?: InventorySession;
  error?: string;
}

// Export options
export interface ExportOptions {
  format: "csv" | "excel" | "pdf";
  dateRange?: {
    from: string;
    to: string;
  };
  includeImages?: boolean;
  includeNotes?: boolean;
  groupBy?: "product" | "session" | "date";
}
