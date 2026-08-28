// HTML5 Device Notification Manager, Service Worker Push & In-App Toast Dispatcher
import { soundEngine } from './audioTone';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  avatarUrl?: string;
  type: 'MESSAGE' | 'COMMENT' | 'CALL' | 'LIKE' | 'SYSTEM';
  timestamp: number;
  data?: any;
}

type NotificationListener = (notif: AppNotification) => void;

class NotificationManager {
  private listeners: Set<NotificationListener> = new Set();
  private isPermissionRequested: boolean = false;
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initServiceWorker();
    this.checkCurrentPermission();
  }

  private async initServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        this.swRegistration = reg;
      } catch {
        // Service worker registration fallback
      }
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && ('Notification' in window || 'serviceWorker' in navigator);
  }

  getPermissionState(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      this.isPermissionRequested = true;
      const permission = await Notification.requestPermission();
      if (permission === 'granted' && 'serviceWorker' in navigator) {
        this.initServiceWorker();
      }
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  subscribe(listener: NotificationListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private checkCurrentPermission() {
    if (this.isSupported() && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      this.initServiceWorker();
    }
  }

  // Send an alert to device system notifications + in-app overlay
  async notify(title: string, options: {
    body: string;
    icon?: string;
    avatarUrl?: string;
    type?: 'MESSAGE' | 'COMMENT' | 'CALL' | 'LIKE' | 'SYSTEM';
    tag?: string;
    data?: any;
    playAudio?: boolean;
  }) {
    const notif: AppNotification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title,
      body: options.body,
      icon: options.icon || options.avatarUrl || '/icon.png',
      avatarUrl: options.avatarUrl || options.icon,
      type: options.type || 'MESSAGE',
      timestamp: Date.now(),
      data: options.data,
    };

    // Play notification audio tone and vibrate device
    if (options.playAudio !== false && options.type !== 'CALL') {
      soundEngine.playNotificationSound();
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {}
    }

    // Trigger in-app UI listeners
    this.listeners.forEach((fn) => fn(notif));

    // Send Background / OS level device notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const iconUrl = options.avatarUrl || options.icon || '/icon.png';
      const notificationTag = options.tag || notif.id;

      // 1. Try Service Worker showNotification (works in background & mobile)
      let swDispatched = false;
      try {
        if ('serviceWorker' in navigator) {
          const reg = this.swRegistration || (await navigator.serviceWorker.ready);
          if (reg && reg.showNotification) {
            await (reg.showNotification as any)(title, {
              body: options.body,
              icon: iconUrl,
              badge: '/icon.png',
              tag: notificationTag,
              renotify: true,
              data: {
                url: '/',
                ...options.data,
              },
            });
            swDispatched = true;
          }
        }
      } catch {
        swDispatched = false;
      }

      // 2. Fallback to standard Window Notification if SW was unavailable
      if (!swDispatched) {
        try {
          const nativeNotif = new Notification(title, {
            body: options.body,
            icon: iconUrl,
            badge: '/icon.png',
            tag: notificationTag,
          });
          nativeNotif.onclick = () => {
            window.focus();
            if (options.data?.onClick) {
              options.data.onClick();
            }
            nativeNotif.close();
          };
        } catch {}
      }
    }
  }
}

export const notificationManager = new NotificationManager();
