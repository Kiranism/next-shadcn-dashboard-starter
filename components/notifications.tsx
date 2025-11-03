'use client';

import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Package, CheckCircle2, Truck, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsAsRead
} from '@/utils/notifications';
import { CurrentUserContextType } from '@/@types/user';
import { UserContext } from '@/context/UserProvider';
import React from 'react';

interface Notification {
  _id: string;
  orderId: string;
  type:
    | 'NEW_ORDER'
    | 'confirmed'
    | 'preparing'
    | 'ORDER_SHIPPED'
    | 'delivered'
    | 'alert';
  title: string;
  message: string;
  createdAt: Date | string;
  read: boolean;
  orderAmount?: number;
  customerName?: string;
}

export function Notifications() {
  const { user } = React.useContext(UserContext) as CurrentUserContextType;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    markNotificationRead(id, user?.storeId, user?.token)
      .then(() => setRefresh((prev) => !prev))
      .catch((err) => console.error('Error marking as read:', err));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    markAllNotificationsAsRead(user?.storeId, user?.token)
      .then(() => setRefresh((prev) => !prev))
      .catch((err) => console.error('Error marking all as read:', err));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_ORDER':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'preparing':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'ORDER_SHIPPED':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTime = (date: Date | string) => {
    if (!date) return '';
    const parsed = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(parsed.getTime())) return ''; // handle invalid date

    const now = new Date();
    const diff = Math.floor((now.getTime() - parsed.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  useEffect(() => {
    if (user?.token && user?.storeId) {
      setIsLoading(true);
      getNotifications(user.storeId, user.token)
        .then((res) => {
          if (res?.data) {
            setNotifications(res.data);
          }
        })
        .catch((err) => console.error('Error fetching notifications:', err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user?.token, user?.storeId, refresh]);

  useEffect(() => {
    if (!user?.storeId) return;

    const socket = io('http://localhost:9000', {
      transports: ['websocket']
    });

    socket.on('connect', () => console.log('✅ Connected to socket.io'));
    socket.on('connect_error', (err) => console.error('❌ Socket error:', err));

    socket.emit('register', user.storeId);

    socket.on(`notification:${user.storeId}`, (notification) => {
      console.log('🔔 New notification:', notification);

      setNotifications((prev) => [notification, ...prev]);
      toast.success(notification.title || 'New notification', {
        description: notification.message,
        duration: 8000
      });
    });

    const cleanup = () => {
      socket.disconnect();
    };
    return cleanup;
  }, [user?.storeId]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <DropdownMenuLabel className="m-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-1 text-xs text-white">
              {unreadCount} new
            </span>
          )}
        </div>

        <ScrollArea className="h-96">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification, index) => (
                <div
                  key={notification._id || `${notification.title}-${index}`}
                  onClick={() => markAsRead(notification._id)}
                  className={`cursor-pointer px-4 py-3 transition-colors ${
                    notification.read
                      ? 'bg-background hover:bg-muted/50'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      {notification.customerName && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="font-medium">
                            {notification.customerName}
                          </span>
                          {notification.orderAmount && (
                            <span>
                              {' '}
                              • ${notification.orderAmount.toFixed(2)}
                            </span>
                          )}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <p className="text-sm">No notifications</p>
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && !isLoading && (
          <>
            <DropdownMenuSeparator />
            <div className="px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
