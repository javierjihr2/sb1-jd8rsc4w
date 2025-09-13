import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { analyticsManager, ANALYTICS_EVENTS, UserMetrics, SessionData } from '../lib/analytics';
import { useMonitoring } from './useMonitoring';

interface UseAnalyticsOptions {
  screenName?: string;
  autoTrackScreenView?: boolean;
  trackAppStateChanges?: boolean;
  trackSessionEvents?: boolean;
}

interface AnalyticsHookReturn {
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  trackScreenView: (screenName: string, screenClass?: string) => void;
  trackUserAction: (action: string, details?: Record<string, any>) => void;
  trackConversion: (type: string, value: number, currency?: string) => void;
  trackFeatureUsage: (featureName: string, context?: string) => void;
  trackSearch: (query: string, resultsCount: number, category?: string) => void;
  trackTutorial: (step: number, completed: boolean, stepName?: string) => void;
  setUserProperties: (properties: Record<string, any>) => void;
  getUserMetrics: () => Promise<UserMetrics | null>;
  getCurrentSession: () => Promise<SessionData | null>;
  getAnalyticsStatus: () => any;
}

export function useAnalytics(options: UseAnalyticsOptions = {}): AnalyticsHookReturn {
  const {
    screenName,
    autoTrackScreenView = true,
    trackAppStateChanges = true,
    trackSessionEvents = true
  } = options;

  const { trackError } = useMonitoring({ screenName });
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const screenViewTrackedRef = useRef<boolean>(false);

  // Track screen view automáticamente
  useEffect(() => {
    if (autoTrackScreenView && screenName && !screenViewTrackedRef.current) {
      trackScreenView(screenName);
      screenViewTrackedRef.current = true;
    }
  }, [screenName, autoTrackScreenView]);

  // Track cambios de estado de la app
  useEffect(() => {
    if (!trackAppStateChanges) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (previousState === 'background' && nextAppState === 'active') {
        // App volvió al foreground
        analyticsManager.trackEvent(ANALYTICS_EVENTS.APP_FOREGROUND, {
          previous_state: previousState,
          screen_name: screenName
        });
      } else if (previousState === 'active' && nextAppState === 'background') {
        // App fue al background
        analyticsManager.trackEvent(ANALYTICS_EVENTS.APP_BACKGROUND, {
          previous_state: previousState,
          screen_name: screenName
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [trackAppStateChanges, screenName]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (trackSessionEvents && screenName) {
        analyticsManager.trackEvent('component_unmount', {
          component_name: screenName,
          timestamp: Date.now()
        });
      }
    };
  }, [trackSessionEvents, screenName]);

  const trackEvent = useCallback((eventName: string, parameters?: Record<string, any>) => {
    try {
      analyticsManager.trackEvent(eventName, {
        ...parameters,
        source_screen: screenName,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error tracking event:', error);
      trackError(error as Error, 'analytics_track_event');
    }
  }, [screenName, trackError]);

  const trackScreenView = useCallback((screenName: string, screenClass?: string) => {
    try {
      analyticsManager.trackScreenView(screenName, screenClass);
    } catch (error) {
      console.error('Error tracking screen view:', error);
      trackError(error as Error, 'analytics_screen_view');
    }
  }, [trackError]);

  const trackUserAction = useCallback((action: string, details?: Record<string, any>) => {
    try {
      analyticsManager.trackEvent(ANALYTICS_EVENTS.FEATURE_USED, {
        action,
        screen_name: screenName,
        ...details,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error tracking user action:', error);
      trackError(error as Error, 'analytics_user_action');
    }
  }, [screenName, trackError]);

  const trackConversion = useCallback((type: string, value: number, currency: string = 'USD') => {
    try {
      analyticsManager.trackCustomConversion(type, value, currency);
    } catch (error) {
      console.error('Error tracking conversion:', error);
      trackError(error as Error, 'analytics_conversion');
    }
  }, [trackError]);

  const trackFeatureUsage = useCallback((featureName: string, context?: string) => {
    try {
      analyticsManager.trackFeatureUsage(featureName, context || screenName);
    } catch (error) {
      console.error('Error tracking feature usage:', error);
      trackError(error as Error, 'analytics_feature_usage');
    }
  }, [screenName, trackError]);

  const trackSearch = useCallback((query: string, resultsCount: number, category?: string) => {
    try {
      analyticsManager.trackSearchQuery(query, resultsCount, category);
    } catch (error) {
      console.error('Error tracking search:', error);
      trackError(error as Error, 'analytics_search');
    }
  }, [trackError]);

  const trackTutorial = useCallback((step: number, completed: boolean, stepName?: string) => {
    try {
      analyticsManager.trackTutorialProgress(step, completed, stepName);
    } catch (error) {
      console.error('Error tracking tutorial:', error);
      trackError(error as Error, 'analytics_tutorial');
    }
  }, [trackError]);

  const setUserProperties = useCallback((properties: Record<string, any>) => {
    try {
      analyticsManager.setUser(properties.userId || '', properties);
    } catch (error) {
      console.error('Error setting user properties:', error);
      trackError(error as Error, 'analytics_user_properties');
    }
  }, [trackError]);

  const getUserMetrics = useCallback(async (): Promise<UserMetrics | null> => {
    try {
      return await analyticsManager.getAdvancedMetrics();
    } catch (error) {
      console.error('Error getting user metrics:', error);
      trackError(error as Error, 'analytics_get_metrics');
      return null;
    }
  }, [trackError]);

  const getCurrentSession = useCallback(async (): Promise<SessionData | null> => {
    try {
      return await analyticsManager.getCurrentSession();
    } catch (error) {
      console.error('Error getting current session:', error);
      trackError(error as Error, 'analytics_get_session');
      return null;
    }
  }, [trackError]);

  const getAnalyticsStatus = useCallback(() => {
    try {
      return analyticsManager.getStatus();
    } catch (error) {
      console.error('Error getting analytics status:', error);
      trackError(error as Error, 'analytics_get_status');
      return null;
    }
  }, [trackError]);

  return {
    trackEvent,
    trackScreenView,
    trackUserAction,
    trackConversion,
    trackFeatureUsage,
    trackSearch,
    trackTutorial,
    setUserProperties,
    getUserMetrics,
    getCurrentSession,
    getAnalyticsStatus
  };
}

// Hook especializado para tracking de e-commerce
export function useEcommerceAnalytics() {
  const { trackEvent, trackConversion } = useAnalytics();

  const trackPurchase = useCallback((transactionId: string, items: any[], value: number, currency: string = 'USD') => {
    trackEvent(ANALYTICS_EVENTS.IN_APP_PURCHASE, {
      transaction_id: transactionId,
      items: items,
      value: value,
      currency: currency,
      item_count: items.length
    });

    trackConversion('purchase', value, currency);
  }, [trackEvent, trackConversion]);

  const trackAddToCart = useCallback((itemId: string, itemName: string, category: string, value: number) => {
    trackEvent('add_to_cart', {
      item_id: itemId,
      item_name: itemName,
      item_category: category,
      value: value
    });
  }, [trackEvent]);

  const trackRemoveFromCart = useCallback((itemId: string, itemName: string, category: string, value: number) => {
    trackEvent('remove_from_cart', {
      item_id: itemId,
      item_name: itemName,
      item_category: category,
      value: value
    });
  }, [trackEvent]);

  const trackViewItem = useCallback((itemId: string, itemName: string, category: string, value?: number) => {
    trackEvent('view_item', {
      item_id: itemId,
      item_name: itemName,
      item_category: category,
      value: value
    });
  }, [trackEvent]);

  const trackBeginCheckout = useCallback((value: number, currency: string = 'USD', itemCount: number) => {
    trackEvent('begin_checkout', {
      value: value,
      currency: currency,
      item_count: itemCount
    });
  }, [trackEvent]);

  return {
    trackPurchase,
    trackAddToCart,
    trackRemoveFromCart,
    trackViewItem,
    trackBeginCheckout
  };
}

// Hook para tracking de engagement social
export function useSocialAnalytics() {
  const { trackEvent } = useAnalytics();

  const trackShare = useCallback((contentType: string, contentId: string, method: string) => {
    trackEvent(ANALYTICS_EVENTS.SHARE_CONTENT, {
      content_type: contentType,
      content_id: contentId,
      method: method
    });
  }, [trackEvent]);

  const trackLike = useCallback((contentType: string, contentId: string) => {
    trackEvent(ANALYTICS_EVENTS.POST_LIKE, {
      content_type: contentType,
      content_id: contentId
    });
  }, [trackEvent]);

  const trackComment = useCallback((contentType: string, contentId: string, commentLength: number) => {
    trackEvent(ANALYTICS_EVENTS.POST_COMMENT, {
      content_type: contentType,
      content_id: contentId,
      comment_length: commentLength
    });
  }, [trackEvent]);

  const trackFollow = useCallback((targetUserId: string, followType: 'follow' | 'unfollow') => {
    trackEvent('social_follow', {
      target_user_id: targetUserId,
      action: followType
    });
  }, [trackEvent]);

  const trackJoinGroup = useCallback((groupId: string, groupType: string, memberCount?: number) => {
    trackEvent(ANALYTICS_EVENTS.SQUAD_JOIN, {
      group_id: groupId,
      group_type: groupType,
      member_count: memberCount
    });
  }, [trackEvent]);

  return {
    trackShare,
    trackLike,
    trackComment,
    trackFollow,
    trackJoinGroup
  };
}

// Hook para tracking de performance
export function usePerformanceAnalytics() {
  const { trackEvent } = useAnalytics();

  const trackSlowPerformance = useCallback((operation: string, duration: number, threshold: number) => {
    if (duration > threshold) {
      trackEvent(ANALYTICS_EVENTS.SLOW_PERFORMANCE, {
        operation: operation,
        duration: duration,
        threshold: threshold,
        performance_ratio: duration / threshold
      });
    }
  }, [trackEvent]);

  const trackNetworkError = useCallback((endpoint: string, errorCode: number, errorMessage: string) => {
    trackEvent(ANALYTICS_EVENTS.NETWORK_ERROR, {
      endpoint: endpoint,
      error_code: errorCode,
      error_message: errorMessage
    });
  }, [trackEvent]);

  const trackMemoryWarning = useCallback((memoryUsage: number, availableMemory: number) => {
    trackEvent(ANALYTICS_EVENTS.MEMORY_WARNING, {
      memory_usage: memoryUsage,
      available_memory: availableMemory,
      memory_pressure: memoryUsage / availableMemory
    });
  }, [trackEvent]);

  return {
    trackSlowPerformance,
    trackNetworkError,
    trackMemoryWarning
  };
}

export default useAnalytics;