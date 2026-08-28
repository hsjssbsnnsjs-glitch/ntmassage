import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  displayName: string;
  size?: number; // size in px
  isOnline?: boolean;
  showOnlineBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  displayName,
  size = 48,
  isOnline = false,
  showOnlineBadge = false,
  className = '',
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset error & loaded status when avatarUrl changes
  useEffect(() => {
    setImageError(false);
    if (avatarUrl && avatarUrl.startsWith('data:')) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [avatarUrl]);

  const initial = displayName ? displayName.trim().charAt(0).toUpperCase() || 'N' : 'N';
  const hasValidUrl = !!(avatarUrl && avatarUrl.trim() && !imageError);

  return (
    <div
      id={`avatar-${(displayName || 'user').replace(/\s+/g, '-').toLowerCase()}`}
      onClick={onClick}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative shrink-0 select-none overflow-hidden rounded-full ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {hasValidUrl ? (
        <>
          {!isLoaded && (
            <div
              className="absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-white font-bold tracking-wider animate-pulse"
              style={{ fontSize: `${Math.round(size * 0.4)}px` }}
            >
              {initial}
            </div>
          )}
          <img
            src={avatarUrl!}
            alt={displayName || 'User'}
            referrerPolicy="no-referrer"
            decoding="async"
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full rounded-full object-cover border border-zinc-800 transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </>
      ) : (
        <div
          className="w-full h-full rounded-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 border border-zinc-700/60 flex items-center justify-center text-white font-black tracking-wider shadow-inner"
          style={{ fontSize: `${Math.max(12, Math.round(size * 0.4))}px` }}
        >
          {initial}
        </div>
      )}

      {showOnlineBadge && isOnline && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-emerald-500 border-2 border-black z-10"
          style={{
            width: `${Math.max(10, size * 0.28)}px`,
            height: `${Math.max(10, size * 0.28)}px`,
          }}
        />
      )}
    </div>
  );
};
