'use client';

// Notifications completely disabled to prevent Firebase messaging connections
// import { useEffect } from 'react';
import { useAuth } from '@/app/auth-provider';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // All notification functionality disabled
  console.log('NotificationProvider: All notifications disabled');
  
  // No useEffect or auth dependencies needed

  return <>{children}</>;
}

// Hook to manually request notification permission - DISABLED
export function useNotifications() {
  const { user } = useAuth();

  const requestPermission = async () => {
    console.log('Notifications disabled - requestPermission does nothing');
    return { success: false, error: 'Notifications disabled' };
  };

  return {
    requestPermission
  };
}