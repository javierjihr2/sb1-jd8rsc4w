'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, X, MessageCircle, Users, Trophy, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { 
  PushNotification, 
  getUserNotifications, 
  markNotificationAsRead, 
  getUnreadNotificationCount,
  subscribeToUserNotifications,
  requestNotificationPermission
} from '@/lib/push-notifications';
import { useAuth } from '@/hooks/useAuth';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Load notifications
  const loadNotifications = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const result = await getUserNotifications(user.uid, 50);
      if (result.success && result.notifications) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load unread count
  const loadUnreadCount = async () => {
    if (!user?.uid) return;
    
    try {
      const result = await getUnreadNotificationCount(user.uid);
      if (result.success && typeof result.count === 'number') {
        setUnreadCount(result.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        toast.error('Error al marcar como leída');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Error al marcar como leída');
    }
  };

  // Request notification permission
  const handleRequestPermission = async () => {
    try {
      const result = await requestNotificationPermission();
      if (result.success) {
        setPermissionGranted(true);
        toast.success('Permisos de notificación concedidos');
      } else {
        toast.error(result.error || 'Error al solicitar permisos');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Error al solicitar permisos');
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
      case 'friend_request':
      case 'friend_accepted':
        return <Users className="h-4 w-4" />;
      case 'match_found':
        return <Trophy className="h-4 w-4" />;
      case 'tournament_invite':
      case 'tournament_reminder':
        return <Trophy className="h-4 w-4" />;
      case 'feed_like':
        return <Heart className="h-4 w-4" />;
      case 'feed_comment':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Get notification color
  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return 'text-red-500';
    if (priority === 'normal') return 'text-blue-500';
    return 'text-gray-500';
  };

  // Format time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  // Handle notification click
  const handleNotificationClick = (notification: PushNotification) => {
    if (!notification.read && notification.id) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    setIsOpen(false);
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToUserNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
      const unreadCount = newNotifications.filter(n => !n.read).length;
      setUnreadCount(unreadCount);
    });

    return unsubscribe;
  }, [user?.uid]);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [isOpen, user?.uid]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
            {unreadCount > 0 && (
              <Badge variant="secondary">
                {unreadCount} nuevas
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          {/* Permission request */}
          {!permissionGranted && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Activar notificaciones</p>
                    <p className="text-xs text-muted-foreground">
                      Recibe notificaciones instantáneas de mensajes y actividades
                    </p>
                  </div>
                  <Button size="sm" onClick={handleRequestPermission}>
                    Activar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Notifications list */}
          <ScrollArea className="h-[calc(100vh-200px)]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No tienes notificaciones
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification, index) => (
                  <div key={notification.id || index}>
                    <Card 
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        !notification.read ? 'border-primary/50 bg-primary/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 ${getNotificationColor(notification.type, notification.priority)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(notification.createdAt)}
                                </span>
                                {!notification.read && (
                                  <div className="h-2 w-2 bg-primary rounded-full" />
                                )}
                              </div>
                            </div>
                            
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.body}
                            </p>
                            
                            {notification.priority === 'high' && (
                              <Badge variant="destructive" className="mt-2 text-xs">
                                Urgente
                              </Badge>
                            )}
                          </div>
                          
                          {!notification.read && notification.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id!);
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {index < notifications.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;