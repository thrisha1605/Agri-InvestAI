import { Notification } from '@/types/notifications';
import { API_BASE_URL, apiRequest, isBackendSessionToken } from '@/lib/api';

export function canUseLiveNotifications(token: string | null): token is string {
  return isBackendSessionToken(token);
}

export function buildNotificationStreamUrl(token: string) {
  const normalizedBase = API_BASE_URL ? API_BASE_URL.replace(/\/$/, '') : '';
  const streamPath = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
  return normalizedBase ? `${normalizedBase}${streamPath}` : streamPath;
}

export async function fetchNotifications() {
  return apiRequest<Notification[]>({
    url: '/api/notifications',
    method: 'GET',
  });
}

export async function markNotificationRead(notificationId: string) {
  return apiRequest<{ message: string }>({
    url: `/api/notifications/${notificationId}/read`,
    method: 'PUT',
  });
}

export async function markAllNotificationRead() {
  return apiRequest<{ message: string }>({
    url: '/api/notifications/read-all',
    method: 'PUT',
  });
}

export async function removeNotification(notificationId: string) {
  return apiRequest<{ message: string }>({
    url: `/api/notifications/${notificationId}`,
    method: 'DELETE',
  });
}
