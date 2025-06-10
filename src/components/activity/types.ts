// src/components/activity/types.ts
export interface ActivityItem {
  id: string;
  type: "add" | "scan" | "update" | "remove";
  productName: string;
  barcode: string;
  quantity?: number;
  timestamp: string;
  brand: string;
  category?: string;
  oldQuantity?: number;
  newQuantity?: number;
}

export interface ActivityItemProps {
  activity: ActivityItem;
  formatTime: (timestamp: string) => string;
}

export interface RecentActivityProps {
  inventory: any[]; // InventoryItem[] from useInventoryManager
  lastScannedBarcode?: string;
  limit?: number;
  compact?: boolean;
  showHeader?: boolean;
}

export interface ActivityConfig {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  getText: (activity: ActivityItem) => string;
}

export type ActivityType = ActivityItem["type"];
