import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { apiGet, apiPost } from '@/api/http';

export type NotificationType = 'order' | 'vendor' | 'delivery' | 'stock' | 'risk' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const SOUND_URLS = {
  order: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  vendor: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3',
  delivery: 'https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3',
  alert: 'https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3',
};

function playSound(type: NotificationType) {
  const soundUrl = type === 'risk' || type === 'stock' ? SOUND_URLS.alert : 
                   type === 'order' ? SOUND_URLS.order :
                   type === 'vendor' ? SOUND_URLS.vendor : SOUND_URLS.delivery;
  
  try {
    const audio = new Audio(soundUrl);
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Ignore autoplay errors
  } catch {
    // Sound playback failed, ignore
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<{ notifications: Notification[]; unread_count: number }>(
        '/api/v1/admin/notifications'
      );
      if (data && 'notifications' in data) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Play sound for high priority notifications
    if (notification.priority === 'high' || notification.priority === 'critical') {
      playSound(notification.type);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await apiPost(`/api/v1/admin/notifications/${id}/read`, {});
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await apiPost('/api/v1/admin/notifications/read-all', {});
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  const removeNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await apiPost(`/api/v1/admin/notifications/${id}`, {});
    } catch (error) {
      console.error('Failed to remove notification:', error);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
