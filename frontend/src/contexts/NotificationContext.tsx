import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Notification, NotificationPreferences } from '@/types/notifications';
import { authService } from '@/lib/auth';
import {
  buildNotificationStreamUrl,
  canUseLiveNotifications,
  fetchNotifications,
  markAllNotificationRead,
  markNotificationRead,
  removeNotification,
} from '@/lib/notifications';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  connectionStatus: 'connecting' | 'live' | 'offline';
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updatePreferences: (prefs: NotificationPreferences) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: {
    projectApprovals: true,
    newInvestments: true,
    harvestReminders: true,
    settlementUpdates: true,
    projectUpdates: true,
    paymentConfirmations: true,
    profitDistributions: true,
    sipAlerts: true,
  },
  push: {
    projectApprovals: true,
    newInvestments: true,
    harvestReminders: true,
    settlementUpdates: true,
    projectUpdates: true,
    paymentConfirmations: true,
    profitDistributions: true,
    sipAlerts: true,
  },
  inApp: {
    projectApprovals: true,
    newInvestments: true,
    harvestReminders: true,
    settlementUpdates: true,
    projectUpdates: true,
    paymentConfirmations: true,
    profitDistributions: true,
    sipAlerts: true,
  },
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const user = authService.getCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'live' | 'offline'>('offline');

  const streamRef = useRef<EventSource | null>(null);
  const seenToastIds = useRef<Set<string>>(new Set());
  const preferencesRef = useRef(preferences);

  const token = authService.getToken();
  const liveNotificationsEnabled = canUseLiveNotifications(token);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  const checkNotificationPreference = useCallback((type: string, prefs: NotificationPreferences['inApp']) => {
    const prefMap: Record<string, keyof typeof prefs> = {
      PROJECT_SUBMITTED: 'projectApprovals',
      PROJECT_APPROVED: 'projectApprovals',
      PROJECT_REJECTED: 'projectApprovals',
      NEW_PROJECT_SUBMITTED: 'projectUpdates',
      NEW_INVESTMENT: 'newInvestments',
      HARVEST_REMINDER: 'harvestReminders',
      SETTLEMENT_COMPLETED: 'settlementUpdates',
      PROJECT_UPDATE: 'projectUpdates',
      PAYMENT_CONFIRMED: 'paymentConfirmations',
      PROFIT_DISTRIBUTED: 'profitDistributions',
      SIP_DEBIT_ALERT: 'sipAlerts',
      PROJECT_FUNDED: 'projectUpdates',
      SALARY_RELEASED: 'paymentConfirmations',
    };
    const prefKey = prefMap[type];
    return prefKey ? prefs[prefKey] : true;
  }, []);

  const mergeNotification = useCallback((incoming: Notification) => {
    setNotifications((prev) => {
      const next = [incoming, ...prev.filter((item) => item.id !== incoming.id)];
      next.sort(
        (left, right) =>
          new Date(String(right.timestamp)).getTime() - new Date(String(left.timestamp)).getTime(),
      );
      return next;
    });
  }, []);

  const showLiveToast = useCallback(
    (notification: Notification) => {
      if (
        !preferencesRef.current.inApp ||
        !checkNotificationPreference(notification.type, preferencesRef.current.inApp) ||
        seenToastIds.current.has(notification.id)
      ) {
        return;
      }

      seenToastIds.current.add(notification.id);
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    },
    [checkNotificationPreference],
  );

  const refreshNotifications = useCallback(async () => {
    if (!user || !liveNotificationsEnabled) {
      setNotifications([]);
      setConnectionStatus('offline');
      return;
    }

    const items = await fetchNotifications();
    setNotifications(items);
    seenToastIds.current = new Set(items.map((item) => item.id));
  }, [liveNotificationsEnabled, user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setConnectionStatus('offline');
      setPreferences(DEFAULT_PREFERENCES);
      return;
    }

    const savedPrefs = localStorage.getItem(`notif_prefs_${user.id}`);
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
      return;
    }

    setPreferences(DEFAULT_PREFERENCES);
  }, [user]);

  useEffect(() => {
    if (!user || !liveNotificationsEnabled || !token) {
      streamRef.current?.close();
      streamRef.current = null;
      setConnectionStatus('offline');
      setNotifications([]);
      return;
    }

    let cancelled = false;
    setConnectionStatus('connecting');
    setNotifications([]);

    void refreshNotifications().catch(() => {
      if (!cancelled) {
        setConnectionStatus('offline');
      }
    });

    const stream = new EventSource(buildNotificationStreamUrl(token));
    streamRef.current = stream;

    stream.addEventListener('connected', () => {
      if (!cancelled) {
        setConnectionStatus('live');
      }
    });

    stream.addEventListener('notification', (event) => {
      if (cancelled) {
        return;
      }

      const notification = JSON.parse((event as MessageEvent).data) as Notification;
      mergeNotification(notification);
      showLiveToast(notification);
      setConnectionStatus('live');
    });

    stream.addEventListener('notification-read', (event) => {
      if (cancelled) {
        return;
      }

      const notification = JSON.parse((event as MessageEvent).data) as Notification;
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
      );
    });

    stream.addEventListener('notifications-read-all', () => {
      if (cancelled) {
        return;
      }

      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    });

    stream.addEventListener('notification-deleted', (event) => {
      if (cancelled) {
        return;
      }

      const payload = JSON.parse((event as MessageEvent).data) as { id?: string };
      if (!payload.id) {
        return;
      }

      setNotifications((prev) => prev.filter((item) => item.id !== payload.id));
    });

    stream.onerror = () => {
      if (!cancelled) {
        setConnectionStatus('offline');
      }
    };

    return () => {
      cancelled = true;
      stream.close();
      if (streamRef.current === stream) {
        streamRef.current = null;
      }
    };
  }, [liveNotificationsEnabled, mergeNotification, refreshNotifications, showLiveToast, token, user]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markAsRead = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));

      if (!liveNotificationsEnabled) {
        return;
      }

      try {
        await markNotificationRead(id);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to mark notification as read.');
        void refreshNotifications();
      }
    },
    [liveNotificationsEnabled, refreshNotifications],
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));

    if (!liveNotificationsEnabled) {
      return;
    }

    try {
      await markAllNotificationRead();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to mark all notifications as read.');
      void refreshNotifications();
    }
  }, [liveNotificationsEnabled, refreshNotifications]);

  const deleteNotification = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      seenToastIds.current.delete(id);

      if (!liveNotificationsEnabled) {
        return;
      }

      try {
        await removeNotification(id);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to delete notification.');
        void refreshNotifications();
      }
    },
    [liveNotificationsEnabled, refreshNotifications],
  );

  const updatePreferences = (prefs: NotificationPreferences) => {
    setPreferences(prefs);
    if (user) {
      localStorage.setItem(`notif_prefs_${user.id}`, JSON.stringify(prefs));
    }
    toast.success('Notification preferences updated');
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };

    mergeNotification(newNotification);

    if (preferences.inApp && checkNotificationPreference(notification.type, preferences.inApp)) {
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        connectionStatus,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        updatePreferences,
        addNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
