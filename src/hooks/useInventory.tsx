// src/hooks/useInventory.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import {
  InventoryItem,
  InventorySession,
  InventorySummary,
  InventoryFilter,
  SaveInventoryResponse,
  InventoryListResponse,
} from "../types/inventory";
import { Product } from "../types/product";

const STORAGE_KEYS = {
  INVENTORY_ITEMS: "inventory_items",
  CURRENT_SESSION: "current_session",
  SESSIONS: "inventory_sessions",
};

export const useInventory = () => {
  // State
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [currentSession, setCurrentSession] = useState<InventorySession | null>(
    null
  );
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    saveToStorage();
  }, [inventoryItems, currentSession, sessions]);

  const loadFromStorage = useCallback(() => {
    try {
      const itemsData = localStorage.getItem(STORAGE_KEYS.INVENTORY_ITEMS);
      const sessionData = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      const sessionsData = localStorage.getItem(STORAGE_KEYS.SESSIONS);

      if (itemsData) {
        setInventoryItems(JSON.parse(itemsData));
      }

      if (sessionData) {
        setCurrentSession(JSON.parse(sessionData));
      }

      if (sessionsData) {
        setSessions(JSON.parse(sessionsData));
      }
    } catch (err) {
      console.error("Error loading inventory data from storage:", err);
    }
  }, []);

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.INVENTORY_ITEMS,
        JSON.stringify(inventoryItems)
      );
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_SESSION,
        JSON.stringify(currentSession)
      );
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (err) {
      console.error("Error saving inventory data to storage:", err);
    }
  }, [inventoryItems, currentSession, sessions]);

  // Generate unique ID
  const generateId = () => {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Create new session
  const createSession = useCallback(
    (name: string, description?: string, location?: string) => {
      const newSession: InventorySession = {
        id: generateId(),
        name,
        description,
        location,
        startedAt: new Date().toISOString(),
        totalItems: 0,
        totalQuantity: 0,
        status: "active",
      };

      setCurrentSession(newSession);
      setSessions((prev) => [newSession, ...prev]);

      console.log("📝 New inventory session created:", newSession.name);
      return newSession;
    },
    []
  );

  // End current session
  const endSession = useCallback(() => {
    if (!currentSession) return;

    const sessionItems = inventoryItems.filter(
      (item) => item.session === currentSession.id
    );
    const updatedSession: InventorySession = {
      ...currentSession,
      endedAt: new Date().toISOString(),
      status: "completed",
      totalItems: sessionItems.length,
      totalQuantity: sessionItems.reduce((sum, item) => sum + item.quantity, 0),
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === currentSession.id ? updatedSession : s))
    );
    setCurrentSession(null);

    console.log("✅ Session completed:", updatedSession.name);
    return updatedSession;
  }, [currentSession, inventoryItems]);

  // Save inventory item
  const saveInventoryItem = useCallback(
    async (
      product: Product,
      quantity: number,
      unit: "ea" | "dsp" | "cs",
      notes?: string
    ): Promise<SaveInventoryResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        // Get unit label
        const unitLabels = {
          ea: "ชิ้น (Each)",
          dsp: "แพ็ค (Display Pack)",
          cs: "ลัง (Case/Carton)",
        };

        const newItem: InventoryItem = {
          id: generateId(),
          product,
          barcode: product.barcode,
          quantity,
          unit,
          unitLabel: unitLabels[unit],
          notes,
          scannedAt: new Date().toISOString(),
          condition: "good",
          session: currentSession?.id,
        };

        // Add to inventory
        setInventoryItems((prev) => [newItem, ...prev]);

        // Update current session totals
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            totalItems: currentSession.totalItems + 1,
            totalQuantity: currentSession.totalQuantity + quantity,
          };
          setCurrentSession(updatedSession);
          setSessions((prev) =>
            prev.map((s) => (s.id === currentSession.id ? updatedSession : s))
          );
        }

        console.log("💾 Inventory item saved:", {
          product: product.name,
          quantity,
          unit: unitLabels[unit],
        });

        return {
          success: true,
          data: newItem,
        };
      } catch (err: any) {
        const errorMessage = `เกิดข้อผิดพลาดในการบันทึก: ${err.message}`;
        setError(errorMessage);
        console.error("Error saving inventory item:", err);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [currentSession]
  );

  // Get inventory items with filter
  const getInventoryItems = useCallback(
    (filter?: InventoryFilter): InventoryItem[] => {
      let filteredItems = [...inventoryItems];

      if (filter) {
        if (filter.dateFrom) {
          filteredItems = filteredItems.filter(
            (item) => new Date(item.scannedAt) >= new Date(filter.dateFrom!)
          );
        }

        if (filter.dateTo) {
          filteredItems = filteredItems.filter(
            (item) => new Date(item.scannedAt) <= new Date(filter.dateTo!)
          );
        }

        if (filter.productName) {
          filteredItems = filteredItems.filter((item) =>
            item.product.name
              .toLowerCase()
              .includes(filter.productName!.toLowerCase())
          );
        }

        if (filter.barcode) {
          filteredItems = filteredItems.filter((item) =>
            item.barcode.includes(filter.barcode!)
          );
        }

        if (filter.session) {
          filteredItems = filteredItems.filter(
            (item) => item.session === filter.session
          );
        }

        if (filter.condition) {
          filteredItems = filteredItems.filter(
            (item) => item.condition === filter.condition
          );
        }

        if (filter.unit) {
          filteredItems = filteredItems.filter(
            (item) => item.unit === filter.unit
          );
        }
      }

      return filteredItems.sort(
        (a, b) =>
          new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
      );
    },
    [inventoryItems]
  );

  // Get inventory summary
  const getInventorySummary = useCallback((): InventorySummary => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const todayItems = inventoryItems.filter(
      (item) => new Date(item.scannedAt) >= todayStart
    );

    // Group by product for top products
    const productGroups = inventoryItems.reduce((acc, item) => {
      const productId = item.product.id;
      if (!acc[productId]) {
        acc[productId] = {
          product: item.product,
          totalQuantity: 0,
          scanCount: 0,
        };
      }
      acc[productId].totalQuantity += item.quantity;
      acc[productId].scanCount += 1;
      return acc;
    }, {} as Record<string, { product: Product; totalQuantity: number; scanCount: number }>);

    const topProducts = Object.values(productGroups)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    return {
      totalSessions: sessions.length,
      totalItems: inventoryItems.length,
      totalQuantity: inventoryItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      lastScanTime:
        inventoryItems.length > 0 ? inventoryItems[0].scannedAt : undefined,
      topProducts,
      todayStats: {
        items: todayItems.length,
        quantity: todayItems.reduce((sum, item) => sum + item.quantity, 0),
        sessions: sessions.filter((s) => new Date(s.startedAt) >= todayStart)
          .length,
      },
    };
  }, [inventoryItems, sessions]);

  // Delete inventory item
  const deleteInventoryItem = useCallback(
    (itemId: string) => {
      const item = inventoryItems.find((i) => i.id === itemId);
      if (!item) return false;

      setInventoryItems((prev) => prev.filter((i) => i.id !== itemId));

      // Update session totals if item belongs to current session
      if (currentSession && item.session === currentSession.id) {
        const updatedSession = {
          ...currentSession,
          totalItems: Math.max(0, currentSession.totalItems - 1),
          totalQuantity: Math.max(
            0,
            currentSession.totalQuantity - item.quantity
          ),
        };
        setCurrentSession(updatedSession);
        setSessions((prev) =>
          prev.map((s) => (s.id === currentSession.id ? updatedSession : s))
        );
      }

      console.log("🗑️ Inventory item deleted:", item.product.name);
      return true;
    },
    [inventoryItems, currentSession]
  );

  // Update inventory item condition
  const updateItemCondition = useCallback(
    (itemId: string, condition: InventoryItem["condition"]) => {
      setInventoryItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, condition } : item))
      );
    },
    []
  );

  // Clear all data
  const clearAllData = useCallback(() => {
    setInventoryItems([]);
    setCurrentSession(null);
    setSessions([]);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    console.log("🧹 All inventory data cleared");
  }, []);

  // Export data
  const exportData = useCallback(() => {
    const data = {
      items: inventoryItems,
      sessions: sessions,
      exportedAt: new Date().toISOString(),
      summary: getInventorySummary(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_export_${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log("📊 Inventory data exported");
  }, [inventoryItems, sessions, getInventorySummary]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    inventoryItems: getInventoryItems(),
    currentSession,
    sessions,
    isLoading,
    error,

    // Actions
    createSession,
    endSession,
    saveInventoryItem,
    getInventoryItems,
    getInventorySummary,
    deleteInventoryItem,
    updateItemCondition,
    clearAllData,
    exportData,
    clearError,

    // Computed values
    hasActiveSession: !!currentSession,
    todayItemsCount: getInventoryItems({
      dateFrom: new Date().toISOString().split("T")[0],
    }).length,
  };
};
