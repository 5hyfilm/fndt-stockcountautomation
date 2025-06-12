// ./src/components/notifications/NotificationContainer.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  actions?: NotificationAction[];
}

interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
  position = "top-right",
}) => {
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 space-y-2 max-w-sm w-full`}
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

// NotificationItem Component
interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRemove,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show notification
    const showTimer = setTimeout(() => setIsVisible(true), 100);

    // Auto hide notification
    if (notification.duration && notification.duration > 0) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onRemove(notification.id), 300);
      }, notification.duration);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }

    return () => clearTimeout(showTimer);
  }, [notification.duration, notification.id, onRemove]);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(notification.id), 300);
  };

  const getTypeStyles = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📢";
    }
  };

  return (
    <div
      className={`transform transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className={`border rounded-lg shadow-lg p-4 ${getTypeStyles()}`}>
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0">{getIcon()}</span>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{notification.title}</h4>
            {notification.message && (
              <p className="text-sm mt-1 opacity-90">{notification.message}</p>
            )}

            {notification.actions && notification.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      action.variant === "primary"
                        ? "bg-current text-white opacity-80 hover:opacity-100"
                        : "bg-white/20 hover:bg-white/30"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleRemove}
            className="text-current opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = `notification_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const newNotification: Notification = {
        id,
        duration: 5000, // Default 5 seconds
        ...notification,
      };

      setNotifications((prev) => [...prev, newNotification]);
      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Helper functions for different types
  const showSuccess = useCallback(
    (title: string, message?: string, actions?: NotificationAction[]) => {
      return addNotification({ type: "success", title, message, actions });
    },
    [addNotification]
  );

  const showError = useCallback(
    (title: string, message?: string, actions?: NotificationAction[]) => {
      return addNotification({
        type: "error",
        title,
        message,
        actions,
        duration: 8000,
      });
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (title: string, message?: string, actions?: NotificationAction[]) => {
      return addNotification({
        type: "warning",
        title,
        message,
        actions,
        duration: 6000,
      });
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (title: string, message?: string, actions?: NotificationAction[]) => {
      return addNotification({ type: "info", title, message, actions });
    },
    [addNotification]
  );

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

// Product Detection Notification Component
// Define proper Product interface instead of using 'any'
interface Product {
  id?: string;
  name: string;
  name_en?: string;
  brand?: string;
  category?: string;
  size?: number;
  unit?: string;
  price?: number;
  barcode?: string;
  sku?: string;
  description?: string;
  country_of_origin?: string;
  storage_instructions?: string;
  ingredients?: string[];
  allergens?: string[];
  nutrition_info?: Record<string, unknown>;
}

interface ProductDetectionNotificationProps {
  product: Product; // Changed from 'any' to 'Product'
  onAddToInventory: () => void;
  onViewDetails: () => void;
}

export const ProductDetectionNotification: React.FC<
  ProductDetectionNotificationProps
> = ({ product, onAddToInventory, onViewDetails }) => {
  const { showSuccess } = useNotifications();

  useEffect(() => {
    if (product) {
      const productName = product.name || product.name_en || "สินค้าที่ตรวจพบ";
      const brandInfo = product.brand ? ` - ${product.brand}` : "";

      showSuccess("พบสินค้าแล้ว!", `${productName}${brandInfo}`, [
        {
          label: "เพิ่มเข้า Stock",
          onClick: onAddToInventory,
          variant: "primary",
        },
        {
          label: "ดูรายละเอียด",
          onClick: onViewDetails,
          variant: "secondary",
        },
      ]);
    }
  }, [product, showSuccess, onAddToInventory, onViewDetails]);

  return null;
};
