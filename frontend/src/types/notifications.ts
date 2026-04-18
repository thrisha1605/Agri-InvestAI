/* ================================
   Notification System
   Agri-Invest Platform
================================ */

const NOTIFICATION_KEY = "agriinvest_notifications";

/* ================================
   Notification Types
================================ */

export type NotificationType =
  // Farmer
  | "PROJECT_SUBMITTED"
  | "PROJECT_APPROVED"
  | "PROJECT_REJECTED"
  | "NEW_INVESTMENT"
  | "HARVEST_REMINDER"
  | "COMPLETION_APPROVED"
  | "COMPLETION_REJECTED"
  | "SETTLEMENT_COMPLETED"

  // Investor
  | "PROJECT_UPDATE"
  | "PAYMENT_CONFIRMED"
  | "PROFIT_DISTRIBUTED"
  | "SIP_DEBIT_ALERT"
  | "PROJECT_FUNDED"

  // Agri Partner
  | "WORK_REQUEST_APPROVED"
  | "WORK_ASSIGNED"
  | "SALARY_RELEASED"

  // Admin
  | "NEW_PROJECT_SUBMITTED"
  | "COMPLETION_REQUESTED"
  | "PARTNER_REQUEST"

  // System
  | "SYSTEM_ALERT";

/* ================================
   Notification Interface
================================ */

export interface Notification {
  id: string;
  userId?: string;

  type: NotificationType;

  title: string;
  message: string;

  timestamp: string | Date;
  read: boolean;

  actionUrl?: string;

  metadata?: {
    projectId?: string;
    projectName?: string;
    investorName?: string;
    partnerName?: string;
    amount?: number;
  };
}

/* ================================
   Notification Preferences
================================ */

export interface NotificationPreferences {
  email: {
    projectApprovals: boolean;
    newInvestments: boolean;
    harvestReminders: boolean;
    settlementUpdates: boolean;
    projectUpdates: boolean;
    paymentConfirmations: boolean;
    profitDistributions: boolean;
    sipAlerts: boolean;
  };

  push: {
    projectApprovals: boolean;
    newInvestments: boolean;
    harvestReminders: boolean;
    settlementUpdates: boolean;
    projectUpdates: boolean;
    paymentConfirmations: boolean;
    profitDistributions: boolean;
    sipAlerts: boolean;
  };

  inApp: {
    projectApprovals: boolean;
    newInvestments: boolean;
    harvestReminders: boolean;
    settlementUpdates: boolean;
    projectUpdates: boolean;
    paymentConfirmations: boolean;
    profitDistributions: boolean;
    sipAlerts: boolean;
  };
}

/* ================================
   Default Preferences
================================ */

export const defaultNotificationPreferences: NotificationPreferences = {
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

/* ================================
   Storage Helpers
================================ */

function getAllNotifications(): Notification[] {
  const raw = localStorage.getItem(NOTIFICATION_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveNotifications(notifications: Notification[]) {
  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
}

/* ================================
   Create Notification
================================ */

export function addNotification(notification: Omit<Notification, "id" | "timestamp" | "read">) {

  const all = getAllNotifications();

  const newNotification: Notification = {
    ...notification,
    id: "notif_" + Date.now(),
    timestamp: new Date().toISOString(),
    read: false,
  };

  all.unshift(newNotification);

  saveNotifications(all);

  return newNotification;
}

/* ================================
   Get User Notifications
================================ */

export function getUserNotifications(userId: string): Notification[] {

  const all = getAllNotifications();

  return all.filter(n => n.userId === userId);

}

/* ================================
   Unread Count
================================ */

export function getUnreadNotificationCount(userId: string): number {

  return getUserNotifications(userId).filter(n => !n.read).length;

}

/* ================================
   Mark Notification Read
================================ */

export function markNotificationAsRead(notificationId: string) {

  const all = getAllNotifications();

  const index = all.findIndex(n => n.id === notificationId);

  if (index >= 0) {
    all[index].read = true;
    saveNotifications(all);
  }

}

/* ================================
   Mark All As Read
================================ */

export function markAllNotificationsAsRead(userId: string) {

  const all = getAllNotifications();

  all.forEach(n => {
    if (n.userId === userId) {
      n.read = true;
    }
  });

  saveNotifications(all);

}

/* ================================
   Delete Notification
================================ */

export function deleteNotification(notificationId: string) {

  const all = getAllNotifications();

  const updated = all.filter(n => n.id !== notificationId);

  saveNotifications(updated);

}

/* ================================
   Clear User Notifications
================================ */

export function clearUserNotifications(userId: string) {

  const all = getAllNotifications();

  const updated = all.filter(n => n.userId !== userId);

  saveNotifications(updated);

}
