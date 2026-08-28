import React, { useEffect, useState } from 'react';
import { notificationManager, AppNotification } from '../lib/notifications';
import { MessageSquare, Heart, MessageCircle, Phone, X } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface NotificationBannerProps {
  onNotificationClick?: (notif: AppNotification) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ onNotificationClick }) => {
  const [activeNotifications, setActiveNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((notif) => {
      setActiveNotifications((prev) => [notif, ...prev].slice(0, 3));
      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        setActiveNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      }, 4500);
    });
    return unsubscribe;
  }, []);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (activeNotifications.length === 0) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm sm:max-w-md px-3 pointer-events-none space-y-2">
      {activeNotifications.map((notif) => (
        <div
          key={notif.id}
          onClick={() => {
            if (onNotificationClick) onNotificationClick(notif);
            setActiveNotifications((prev) => prev.filter((n) => n.id !== notif.id));
          }}
          className="pointer-events-auto bg-zinc-950/95 text-white border border-zinc-700/80 backdrop-blur-xl p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 cursor-pointer hover:border-zinc-500 transition-all transform animate-in slide-in-from-top-3 duration-200"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <UserAvatar
                avatarUrl={notif.avatarUrl || notif.icon}
                displayName={notif.title}
                size={38}
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
                {notif.type === 'MESSAGE' && <MessageSquare size={10} className="text-white" />}
                {notif.type === 'COMMENT' && <MessageCircle size={10} className="text-emerald-400" />}
                {notif.type === 'LIKE' && <Heart size={10} className="text-red-500 fill-red-500" />}
                {notif.type === 'CALL' && <Phone size={10} className="text-blue-400" />}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="font-bold text-xs text-white truncate">{notif.title}</p>
                <span className="text-[10px] text-zinc-400 font-mono">الآن</span>
              </div>
              <p className="text-xs text-zinc-300 truncate mt-0.5">{notif.body}</p>
            </div>
          </div>
          <button
            onClick={(e) => handleDismiss(notif.id, e)}
            className="w-6 h-6 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
