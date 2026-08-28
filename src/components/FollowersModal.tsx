import React, { useState } from 'react';
import { X, Search, UserCheck, UserPlus } from 'lucide-react';
import { User } from '../types';
import { UserAvatar } from './UserAvatar';

interface FollowersModalProps {
  isOpen: boolean;
  targetUser: User;
  initialTab?: 'followers' | 'following';
  followersList: User[];
  followingList: User[];
  currentUserId?: string;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  onToggleFollow: (userId: string) => void;
  isFollowingUser: (userId: string) => boolean;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  targetUser,
  initialTab = 'followers',
  followersList,
  followingList,
  currentUserId,
  onClose,
  onSelectUser,
  onToggleFollow,
  isFollowingUser,
}) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const currentList = activeTab === 'followers' ? followersList : followingList;
  const filteredList = currentList.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase().trim()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div
      id="followers-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="followers-modal-content"
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl max-h-[80vh] flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="font-bold text-base">@{targetUser.username}</h3>
          <button
            id="close-followers-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 border-b border-zinc-800">
          <button
            id="tab-followers"
            onClick={() => setActiveTab('followers')}
            className={`py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'followers'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            المتابعون ({followersList.length})
          </button>
          <button
            id="tab-following"
            onClick={() => setActiveTab('following')}
            className={`py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'following'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            يتابعهم ({followingList.length})
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في القائمة..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pr-9 pl-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              لا توجد حسابات مطابقة
            </div>
          ) : (
            filteredList.map((user) => {
              const isMe = user.id === currentUserId;
              const following = isFollowingUser(user.id);

              return (
                <div
                  key={user.id}
                  id={`user-item-${user.id}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900/60 transition-colors"
                >
                  <div
                    onClick={() => {
                      onClose();
                      onSelectUser(user.id);
                    }}
                    className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                  >
                    <UserAvatar
                      avatarUrl={user.avatarUrl}
                      displayName={user.displayName}
                      size={44}
                      isOnline={user.isOnline}
                      showOnlineBadge={true}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-white truncate">
                        {user.displayName} {isMe && '(أنت)'}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">@{user.username}</p>
                    </div>
                  </div>

                  {!isMe && (
                    <button
                      onClick={() => onToggleFollow(user.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        following
                          ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          : 'bg-white text-black hover:bg-zinc-200'
                      }`}
                    >
                      {following ? (
                        <>
                          <UserCheck size={14} />
                          <span>تتابعه</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          <span>متابعة</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
