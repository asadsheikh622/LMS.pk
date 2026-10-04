import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext.tsx';

export interface NotificationItem {
  id: number;
  userId: number;
  senderId?: number | null;
  senderName: string;
  senderRole: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  activeNotification: NotificationItem | null;
  openNotification: (item: NotificationItem) => void;
  closeNotification: () => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);
  const pollingRef = useRef<number | null>(null);

  const fetchNotifications = useCallback(async (isBackground = false) => {
    if (!token || !user || user.role !== 'STUDENT') {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    if (!isBackground) {
      setIsLoading(true);
    }

    try {
      const res = await fetch('/api/student/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const list: NotificationItem[] = data.notifications || [];
        setNotifications(list);
        setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : list.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      if (!isBackground) {
        setIsLoading(false);
      }
    }
  }, [token, user]);

  const markAsRead = async (id: number) => {
    if (!token) return;

    // Optimistically update
    setNotifications(prev =>
      prev.map(item => (item.id === id ? { ...item, isRead: true } : item))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/student/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('lms:notification_updated'));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;

    // Optimistically update
    setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
    setUnreadCount(0);

    try {
      const res = await fetch('/api/student/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('lms:notification_updated'));
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const openNotification = (item: NotificationItem) => {
    setActiveNotification(item);
    if (!item.isRead) {
      markAsRead(item.id);
    }
  };

  const closeNotification = () => {
    setActiveNotification(null);
  };

  // Set up polling and event listeners
  useEffect(() => {
    if (!token || !user || user.role !== 'STUDENT') {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    // Initial fetch
    fetchNotifications();

    // 5-second polling interval for instant broadcast pickup
    pollingRef.current = window.setInterval(() => {
      fetchNotifications(true);
    }, 5000);

    // Revalidate on window focus & visibility
    const handleFocus = () => fetchNotifications(true);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(true);
      }
    };
    const handleCustomRefresh = () => fetchNotifications(true);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('lms:refresh_notifications', handleCustomRefresh);
    window.addEventListener('lms:notification_updated', handleCustomRefresh);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('lms:refresh_notifications', handleCustomRefresh);
      window.removeEventListener('lms:notification_updated', handleCustomRefresh);
    };
  }, [token, user, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        activeNotification,
        openNotification,
        closeNotification,
        markAsRead,
        markAllAsRead,
        refresh: () => fetchNotifications(false),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
