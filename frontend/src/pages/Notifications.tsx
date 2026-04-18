import { Bell, Check, CheckCheck, RefreshCw, Trash2, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/contexts/NotificationContext';

export function Notifications() {
  const {
    notifications,
    unreadCount,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const live = connectionStatus === 'live';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="mt-2 text-sm text-slate-600">
              Real-time updates for approvals, investments, payouts, and project progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={live ? 'secondary' : 'outline'} className="gap-1">
              {live ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {live ? 'Live' : connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </Badge>
            {unreadCount > 0 && <Badge>{unreadCount} unread</Badge>}
            <Button variant="outline" size="sm" onClick={() => void refreshNotifications()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => void markAllAsRead()} disabled={notifications.length === 0}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Inbox
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
                <Bell className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-base font-semibold text-slate-900">No notifications yet</p>
                <p className="mt-2 text-sm text-slate-500">New live alerts will appear here as soon as they arrive.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-2xl border p-4 shadow-sm transition ${
                      notification.read ? 'border-slate-200 bg-white' : 'border-emerald-200 bg-emerald-50/70'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{notification.title}</p>
                          {!notification.read && <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p>
                        <p className="mt-3 text-xs text-slate-500">
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button variant="outline" size="sm" onClick={() => void markAsRead(notification.id)}>
                            <Check className="mr-2 h-4 w-4" />
                            Mark read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => void deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
