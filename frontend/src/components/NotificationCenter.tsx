import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock3,
  DollarSign,
  FolderClock,
  Leaf,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Trash2,
  Wallet,
  Wifi,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

type IconConfig = {
  icon: LucideIcon;
  className: string;
};

export function NotificationCenter() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleNotificationClick = (notification: { id: string; actionUrl?: string }) => {
    void markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: string): IconConfig => {
    const iconMap: Record<string, IconConfig> = {
      PROJECT_SUBMITTED: { icon: FolderClock, className: 'bg-amber-100 text-amber-700' },
      PROJECT_APPROVED: { icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700' },
      PROJECT_REJECTED: { icon: RefreshCcw, className: 'bg-rose-100 text-rose-700' },
      NEW_PROJECT_SUBMITTED: { icon: FolderClock, className: 'bg-amber-100 text-amber-700' },
      NEW_INVESTMENT: { icon: DollarSign, className: 'bg-emerald-100 text-emerald-700' },
      HARVEST_REMINDER: { icon: Leaf, className: 'bg-lime-100 text-lime-700' },
      SETTLEMENT_COMPLETED: { icon: Wallet, className: 'bg-sky-100 text-sky-700' },
      PROJECT_UPDATE: { icon: Clock3, className: 'bg-blue-100 text-blue-700' },
      PAYMENT_CONFIRMED: { icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700' },
      PROFIT_DISTRIBUTED: { icon: Wallet, className: 'bg-emerald-100 text-emerald-700' },
      SIP_DEBIT_ALERT: { icon: Bell, className: 'bg-violet-100 text-violet-700' },
      PROJECT_FUNDED: { icon: ShieldCheck, className: 'bg-cyan-100 text-cyan-700' },
      SALARY_RELEASED: { icon: Wallet, className: 'bg-orange-100 text-orange-700' },
      SYSTEM_ALERT: { icon: Bell, className: 'bg-slate-100 text-slate-700' },
    };

    return iconMap[type] || { icon: Bell, className: 'bg-slate-100 text-slate-700' };
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px]">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
            <Badge variant={connectionStatus === 'live' ? 'secondary' : 'outline'} className="gap-1">
              {connectionStatus === 'live' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connectionStatus === 'live' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </Badge>
            {unreadCount > 0 && <Badge variant="secondary">{unreadCount} new</Badge>}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => void markAllAsRead()} className="h-8 text-xs">
                <CheckCheck className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/notifications/preferences')}
              className="h-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="mb-3 h-12 w-12 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">No notifications</p>
              <p className="mt-1 text-xs text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const iconConfig = getNotificationIcon(notification.type);
                const Icon = iconConfig.icon;

                return (
                  <div
                    key={notification.id}
                    className={`cursor-pointer p-4 transition-colors hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${iconConfig.className}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold ${!notification.read ? 'text-primary' : 'text-gray-900'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <p className="mb-2 line-clamp-2 text-sm text-gray-600">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </p>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void markAsRead(notification.id);
                                }}
                                className="h-7 px-2 text-xs"
                              >
                                <Check className="mr-1 h-3 w-3" />
                                Mark read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                void deleteNotification(notification.id);
                              }}
                              className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" className="w-full text-primary" onClick={() => navigate('/notifications')}>
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
