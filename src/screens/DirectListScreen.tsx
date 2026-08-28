import React, { useState, useEffect } from 'react';
import {
  PlusSquare,
  Settings,
  Search,
  Plus,
  MessageCircle,
  Grid,
  MoreVertical,
  Pin,
  Star,
  BellOff,
  Bell,
  Trash2,
  Check,
  CheckCheck,
  Lock,
  Heart,
  MessageSquare,
  Send,
  Download,
  Sparkles,
  Bookmark,
  RotateCw,
} from 'lucide-react';
import { storage } from '../lib/storage';
import { notificationManager } from '../lib/notifications';
import { User, DirectChatSummary, Post, Story, UserStoryGroup } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { VideoPostPlayer } from '../components/VideoPostPlayer';
import { CommentsModal } from '../components/CommentsModal';
import { FullScreenPostViewer } from '../components/FullScreenPostViewer';
import { ConfirmModal } from '../components/ConfirmModal';
import { getT } from '../lib/translations';

interface DirectListScreenProps {
  currentUser: User;
  onNavigateToChat: (targetUserId: string) => void;
  onNavigateToProfile: (userId: string) => void;
  onNavigateToSettings: () => void;
  onNavigateToCreatePost: () => void;
  onNavigateToCreateStory: () => void;
  onOpenStoryViewer: (allGroups: UserStoryGroup[], initialIndex: number) => void;
}

export const DirectListScreen: React.FC<DirectListScreenProps> = ({
  currentUser,
  onNavigateToChat,
  onNavigateToProfile,
  onNavigateToSettings,
  onNavigateToCreatePost,
  onNavigateToCreateStory,
  onOpenStoryViewer,
}) => {
  const t = getT(storage.getLanguage());
  const [activeTab, setActiveTab] = useState<'chats' | 'feed'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [directSummaries, setDirectSummaries] = useState<DirectChatSummary[]>([]);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [storyGroups, setStoryGroups] = useState<UserStoryGroup[]>([]);

  // Dialog & Action States
  const [selectedUserForAction, setSelectedUserForAction] = useState<User | null>(null);
  const [activeViewingPost, setActiveViewingPost] = useState<Post | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    notificationManager.getPermissionState()
  );

  const loadData = () => {
    const allUsers = storage.getAllUsers();
    const allMessages = storage.getAllUserMessages(currentUser.id);
    const pinned = storage.getPinnedUserIds();
    const favs = storage.getFavoriteUserIds();
    const muted = storage.getMutedUserIds();

    const summaries: DirectChatSummary[] = allUsers
      .map((other) => {
        const isSelf = other.id === currentUser.id;
        const msgs = isSelf
          ? allMessages.filter((m) => m.senderId === currentUser.id && m.receiverId === currentUser.id)
          : allMessages.filter(
              (m) =>
                (m.senderId === currentUser.id && m.receiverId === other.id) ||
                (m.senderId === other.id && m.receiverId === currentUser.id)
            );
        msgs.sort((a, b) => b.timestamp - a.timestamp);
        const last = msgs[0] || null;
        const unread = isSelf ? 0 : msgs.filter((m) => m.receiverId === currentUser.id && !m.isRead).length;
        const isPinned = pinned.includes(other.id);
        const isFav = favs.includes(other.id);
        const isMuted = muted.includes(other.id);

        return {
          user: other,
          lastMessage: last,
          unreadCount: unread,
          lastTimestamp: last ? last.timestamp : 0,
          isPinned,
          isFavorite: isFav,
          isMuted,
        };
      })
      .filter((s) => s.lastMessage !== null || s.isPinned || s.isFavorite || (s.user.id === currentUser.id && storage.getMessagesBetween(currentUser.id, currentUser.id).length > 0))
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return b.lastTimestamp - a.lastTimestamp;
      });

    setDirectSummaries(summaries);
    setFeedPosts(storage.getAllPosts());

    const activeStories = storage.getActiveStories();
    const viewedIds = storage.getViewedStoryIds(currentUser.id);
    const groupedMap = new Map<string, Story[]>();

    activeStories.forEach((st) => {
      const arr = groupedMap.get(st.userId) || [];
      arr.push({ ...st, isViewed: viewedIds.includes(st.id) });
      groupedMap.set(st.userId, arr);
    });

    const groups: UserStoryGroup[] = [];
    groupedMap.forEach((userStories, userId) => {
      const first = userStories[0];
      const hasUnseen = userStories.some((s) => !s.isViewed);
      groups.push({
        userId,
        username: first.username,
        userAvatarUrl: first.userAvatarUrl,
        stories: userStories,
        hasUnseen,
      });
    });

    setStoryGroups(groups.sort((a, b) => (a.hasUnseen === b.hasUnseen ? 0 : a.hasUnseen ? -1 : 1)));
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await storage.syncFromServer();
      loadData();
      setRefreshToast('تم تحديث البيانات بنجاح');
      setTimeout(() => setRefreshToast(null), 2500);
    } catch {
      loadData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    loadData();
    // Periodic background sync with online server
    const syncInterval = async () => {
      await storage.syncFromServer();
      loadData();
    };
    const interval = setInterval(syncInterval, 3000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(storage.searchUsers(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleToggleLike = (post: Post) => {
    storage.togglePostLike(post.id);
    setFeedPosts(storage.getAllPosts());
    if (activeViewingPost && activeViewingPost.id === post.id) {
      setActiveViewingPost(storage.getAllPosts().find((p) => p.id === post.id) || null);
    }
  };

  const handleDownload = async (post: Post) => {
    try {
      if (!post.mediaUrl) return;
      const response = await fetch(post.mediaUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `NT_POST_${Date.now()}.${post.mediaType === 'VIDEO' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(post.mediaUrl, '_blank');
    }
  };

  const handleConfirmClearChat = () => {
    if (!selectedUserForAction) return;
    storage.clearConversation(currentUser.id, selectedUserForAction.id);
    setSelectedUserForAction(null);
    setShowClearChatConfirm(false);
    loadData();
  };

  const handleConfirmDeletePost = () => {
    if (!postToDelete) return;
    storage.deletePost(postToDelete.id);
    setPostToDelete(null);
    if (activeViewingPost?.id === postToDelete.id) {
      setActiveViewingPost(null);
    }
    loadData();
  };

  const myStoryGroup = storyGroups.find((g) => g.userId === currentUser.id);
  const otherStoryGroups = storyGroups.filter((g) => g.userId !== currentUser.id);

  return (
    <div id="direct-list-screen" className="min-h-screen bg-black text-white flex flex-col select-none">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white text-black font-black text-sm flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            NT
          </div>
          <div>
            <h1 className="font-black text-lg tracking-wider">NT MASSAGE</h1>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Refresh Button */}
          <button
            id="top-refresh-btn"
            onClick={handleManualRefresh}
            title="تحديث البيانات"
            disabled={isRefreshing}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw size={17} className={isRefreshing ? 'animate-spin text-white' : ''} />
          </button>

          <button
            id="top-create-post-btn"
            onClick={onNavigateToCreatePost}
            title={t.newPost}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <PlusSquare size={19} />
          </button>

          <button
            id="top-settings-btn"
            onClick={onNavigateToSettings}
            title={t.settingsTitle}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <Settings size={19} />
          </button>

          <button
            id="top-profile-btn"
            onClick={() => onNavigateToProfile(currentUser.id)}
            title={t.editProfile}
            className="p-0.5 rounded-full hover:ring-2 hover:ring-white transition-all cursor-pointer"
          >
            <UserAvatar
              avatarUrl={currentUser.avatarUrl}
              displayName={currentUser.displayName}
              size={32}
            />
          </button>
        </div>
      </header>

      {/* Refresh Toast Banner */}
      {refreshToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/95 border border-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles size={14} className="text-amber-400" />
          <span>{refreshToast}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto pb-16">
        {/* Search Bar */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
            <input
              id="search-users-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchUsersPlaceholder}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full pr-10 pl-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                {t.close}
              </button>
            )}
          </div>
        </div>

        {/* Live Search Results View */}
        {searchQuery.trim() ? (
          <div className="p-3 space-y-2">
            <p className="text-xs font-bold text-zinc-400 px-2">
              {t.search} ({searchResults.length})
            </p>
            {searchResults.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">{t.noSearchResults}</div>
            ) : (
              searchResults.map((u) => {
                const isMe = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex items-center justify-between hover:bg-zinc-900/60 transition-colors"
                  >
                    <div
                      onClick={() => onNavigateToProfile(u.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <UserAvatar
                        avatarUrl={u.avatarUrl}
                        displayName={u.displayName}
                        size={46}
                        isOnline={u.isOnline}
                        showOnlineBadge={true}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-white truncate">
                          {u.displayName} {isMe && `(${t.you})`}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">@{u.username}</p>
                      </div>
                    </div>
                    {!isMe && (
                      <button
                        onClick={() => onNavigateToChat(u.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Send size={14} />
                        <span>{t.send}</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <>
            {/* 24-Hours Stories Row */}
            <div className="px-3 py-2 overflow-x-auto scrollbar-none flex items-center gap-3.5 border-b border-zinc-800/60">
              <div
                id="my-story-avatar-btn"
                onClick={() => {
                  const allGroupsToView = [myStoryGroup, ...otherStoryGroups].filter(Boolean) as UserStoryGroup[];
                  if (myStoryGroup && myStoryGroup.stories.length > 0) {
                    onOpenStoryViewer(allGroupsToView, 0);
                  } else {
                    onNavigateToCreateStory();
                  }
                }}
                className="flex flex-col items-center gap-1 cursor-pointer shrink-0 w-16"
              >
                <div className="relative">
                  <div
                    className={`w-14 h-14 rounded-full p-0.5 ${
                      myStoryGroup && myStoryGroup.stories.length > 0
                        ? 'bg-gradient-to-tr from-white via-zinc-400 to-white'
                        : 'border border-zinc-800'
                    }`}
                  >
                    <UserAvatar
                      avatarUrl={currentUser.avatarUrl}
                      displayName={currentUser.displayName}
                      size={52}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToCreateStory();
                    }}
                    title={t.addStory}
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Plus size={13} className="stroke-[3]" />
                  </button>
                </div>
                <span className="text-[11px] font-semibold text-zinc-300 truncate w-full text-center">
                  {t.yourStory}
                </span>
              </div>

              {otherStoryGroups.map((group) => {
                const allGroupsToView = [myStoryGroup, ...otherStoryGroups].filter(Boolean) as UserStoryGroup[];
                const targetIdx = allGroupsToView.findIndex((g) => g.userId === group.userId);
                return (
                  <div
                    key={group.userId}
                    id={`story-group-${group.userId}`}
                    onClick={() => onOpenStoryViewer(allGroupsToView, Math.max(0, targetIdx))}
                    className="flex flex-col items-center gap-1 cursor-pointer shrink-0 w-16 group"
                  >
                    <div
                      className={`w-14 h-14 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                        group.hasUnseen
                          ? 'bg-gradient-to-tr from-white via-zinc-400 to-white animate-pulse'
                          : 'border border-zinc-700'
                      }`}
                    >
                      <UserAvatar
                        avatarUrl={group.userAvatarUrl}
                        displayName={group.username}
                        size={52}
                      />
                    </div>
                    <span className="text-[11px] text-zinc-300 truncate w-full text-center">
                      @{group.username}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Main Tabs Switcher */}
            <div className="grid grid-cols-2 border-b border-zinc-800 text-center font-bold text-sm bg-black sticky top-14 z-20">
              <button
                id="tab-chats-btn"
                onClick={() => setActiveTab('chats')}
                className={`py-3 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'chats'
                    ? 'border-white text-white font-extrabold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MessageCircle size={18} />
                <span>{t.chats}</span>
                {directSummaries.some((s) => s.unreadCount > 0) && (
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                )}
              </button>
              <button
                id="tab-feed-btn"
                onClick={() => setActiveTab('feed')}
                className={`py-3 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'feed'
                    ? 'border-white text-white font-extrabold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Grid size={18} />
                <span>{t.feed}</span>
              </button>
            </div>

            {/* TAB 1: Direct Chats List */}
            {activeTab === 'chats' && (
              <div className="divide-y divide-zinc-900">
                {directSummaries.length === 0 ? (
                  <div className="py-20 text-center text-zinc-500 space-y-3 px-6">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto text-zinc-400">
                      <MessageCircle size={32} />
                    </div>
                    <h3 className="font-bold text-white text-base">{t.noChatsYet}</h3>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto">{t.startChatting}</p>
                  </div>
                ) : (
                  directSummaries.map((summary) => {
                    const user = summary.user;
                    const lastMsg = summary.lastMessage;
                    const isSenderMe = lastMsg?.senderId === currentUser.id;
                    const timeFormatted = lastMsg
                      ? new Date(lastMsg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '';
                    let previewText = lastMsg?.text || '';
                    if (lastMsg?.mediaType === 'IMAGE') previewText = t.mediaPhoto;
                    if (lastMsg?.mediaType === 'VIDEO') previewText = t.mediaVideo;
                    if (lastMsg?.mediaType === 'VOICE' || lastMsg?.mediaType === 'AUDIO')
                      previewText = t.mediaVoice;

                    return (
                      <div
                        key={user.id}
                        id={`chat-row-${user.id}`}
                        onClick={() => onNavigateToChat(user.id)}
                        className="p-3.5 flex items-center gap-3.5 hover:bg-zinc-900/50 cursor-pointer transition-colors relative group"
                      >
                        <UserAvatar
                          avatarUrl={user.avatarUrl}
                          displayName={user.displayName}
                          size={52}
                          isOnline={user.isOnline}
                          showOnlineBadge={true}
                          onClick={() => onNavigateToProfile(user.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-sm text-white truncate">
                                {user.id === currentUser.id ? `${user.displayName} (الرسائل المحفوظة)` : user.displayName}
                              </span>
                              {user.id === currentUser.id && (
                                <Bookmark size={12} className="text-emerald-400 fill-emerald-400 shrink-0" />
                              )}
                              {summary.isPinned && <Pin size={12} className="text-white fill-white shrink-0" />}
                              {summary.isFavorite && (
                                <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                              )}
                              {summary.isMuted && <BellOff size={12} className="text-zinc-500 shrink-0" />}
                            </div>
                            <span className="text-[11px] text-zinc-500 shrink-0">{timeFormatted}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate flex-1">
                              {isSenderMe && (
                                <span className="shrink-0 text-zinc-500">
                                  {lastMsg?.isRead ? (
                                    <CheckCheck size={14} className="text-emerald-400 inline" />
                                  ) : (
                                    <Check size={14} className="inline" />
                                  )}
                                </span>
                              )}
                              <p className={`truncate ${summary.unreadCount > 0 ? 'text-white font-bold' : ''}`}>
                                {previewText || user.bio || t.chats}
                              </p>
                            </div>
                            {summary.unreadCount > 0 && (
                              <span className="mr-2 px-2 py-0.5 rounded-full bg-white text-black text-[11px] font-black shrink-0">
                                {summary.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserForAction(user);
                          }}
                          title={t.chatOptions}
                          className="w-8 h-8 rounded-full bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    );
                  })
                )}
                <div className="py-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
                  <Lock size={12} />
                  <span>NT MASSAGE • Encrypted Real-Time Platform</span>
                </div>
              </div>
            )}

            {/* TAB 2: Social Posts Feed */}
            {activeTab === 'feed' && (
              <div className="p-3 space-y-4">
                {feedPosts.length === 0 ? (
                  <div className="py-20 text-center text-zinc-500 space-y-3">
                    <Grid size={48} className="stroke-1 mx-auto text-zinc-600" />
                    <p className="font-bold text-white text-base">{t.noFeedPosts}</p>
                    <p className="text-xs text-zinc-400">{t.selectPhotoOrVideo}</p>
                  </div>
                ) : (
                  feedPosts.map((post) => {
                    const isMyPost = post.userId === currentUser.id;
                    const timeString = new Date(post.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <article
                        key={post.id}
                        id={`feed-post-${post.id}`}
                        className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl"
                      >
                        {/* Header */}
                        <div className="p-3 flex items-center justify-between border-b border-zinc-800/60">
                          <div
                            onClick={() => onNavigateToProfile(post.userId)}
                            className="flex items-center gap-2.5 cursor-pointer"
                          >
                            <UserAvatar
                              avatarUrl={post.userAvatarUrl}
                              displayName={post.username}
                              size={38}
                            />
                            <div>
                              <p className="font-bold text-sm text-white">@{post.username}</p>
                              <p className="text-[10px] text-zinc-500">{timeString}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800 flex items-center gap-1">
                              <Sparkles size={11} className="text-white" />
                              <span>4K UHD</span>
                            </span>
                            {isMyPost && (
                              <button
                                onClick={() => setPostToDelete(post)}
                                title={t.delete}
                                className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer border border-zinc-800"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Media Container */}
                        <div
                          onClick={() => setActiveViewingPost(post)}
                          className="bg-zinc-950 flex items-center justify-center cursor-pointer w-full overflow-hidden"
                        >
                          {post.mediaUrl ? (
                            post.mediaType === 'VIDEO' ? (
                              <VideoPostPlayer
                                videoUrl={post.mediaUrl}
                                className="w-full max-h-[600px]"
                                onDoubleTapLike={() => handleToggleLike(post)}
                              />
                            ) : (
                              <img
                                src={post.mediaUrl}
                                alt={post.caption}
                                referrerPolicy="no-referrer"
                                className="w-full h-auto max-h-[650px] object-cover transition-transform duration-200 hover:scale-[1.01]"
                                loading="lazy"
                              />
                            )
                          ) : (
                            <div className="p-8 text-center text-base font-semibold text-white">
                              {post.caption}
                            </div>
                          )}
                        </div>

                        {/* Caption */}
                        {post.caption && (
                          <div
                            onClick={() => setActiveViewingPost(post)}
                            className="px-4 pt-3 text-sm text-zinc-200 leading-relaxed cursor-pointer"
                          >
                            <span>{post.caption}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="px-4 py-2.5 flex items-center justify-between border-t border-zinc-800/60 mt-2">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleToggleLike(post)}
                              className="flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Heart
                                size={20}
                                className={post.isLiked ? 'text-red-500 fill-red-500' : 'text-zinc-300'}
                              />
                              <span>{post.likesCount}</span>
                            </button>

                            <button
                              onClick={() => setActiveCommentsPostId(post.id)}
                              className="flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <MessageSquare size={19} />
                              <span>{post.commentsCount}</span>
                            </button>

                            <button
                              onClick={() => onNavigateToChat(post.userId)}
                              className="text-zinc-300 hover:text-white transition-colors cursor-pointer"
                              title={t.send}
                            >
                              <Send size={18} />
                            </button>
                          </div>

                          {post.mediaUrl && (
                            <button
                              onClick={() => handleDownload(post)}
                              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
                              title={t.downloadMedia}
                            >
                              <Download size={14} />
                              <span>{t.downloadMedia}</span>
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Full Screen Post Viewer Dialog */}
      {activeViewingPost && (() => {
        const currPostIndex = feedPosts.findIndex((p) => p.id === activeViewingPost.id);
        return (
          <FullScreenPostViewer
            post={activeViewingPost}
            currentUser={currentUser}
            onClose={() => setActiveViewingPost(null)}
            onLike={() => handleToggleLike(activeViewingPost)}
            onOpenComments={() => setActiveCommentsPostId(activeViewingPost.id)}
            onUserClick={(uid) => onNavigateToProfile(uid)}
            onDirectMessage={(uid) => onNavigateToChat(uid)}
            onEditCaption={(newCap) => {
              storage.updatePostCaption(activeViewingPost.id, newCap);
              loadData();
            }}
            onDeletePost={() => {
              storage.deletePost(activeViewingPost.id);
              setActiveViewingPost(null);
              loadData();
            }}
            hasPrevPost={currPostIndex > 0}
            hasNextPost={currPostIndex < feedPosts.length - 1}
            onPrevPost={() => currPostIndex > 0 && setActiveViewingPost(feedPosts[currPostIndex - 1])}
            onNextPost={() => currPostIndex < feedPosts.length - 1 && setActiveViewingPost(feedPosts[currPostIndex + 1])}
          />
        );
      })()}

      {/* Comments Drawer / Modal */}
      {activeCommentsPostId && (
        <CommentsModal
          isOpen={true}
          postId={activeCommentsPostId}
          comments={storage.getCommentsForPost(activeCommentsPostId)}
          currentUser={currentUser}
          onClose={() => setActiveCommentsPostId(null)}
          onAddComment={(text) => {
            storage.addComment({
              postId: activeCommentsPostId,
              userId: currentUser.id,
              username: currentUser.username,
              userAvatarUrl: currentUser.avatarUrl,
              text,
            });
            loadData();
          }}
          onDeleteComment={(cmtId) => {
            storage.deleteComment(cmtId);
            loadData();
          }}
        />
      )}

      {/* Long Press / Options Modal for Direct Chat */}
      {selectedUserForAction && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedUserForAction(null)}
        >
          <div
            className="w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-2 text-white animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-bold text-sm text-center border-b border-zinc-800 pb-2">
              @{selectedUserForAction.username}
            </h4>
            <button
              onClick={() => {
                const targetId = selectedUserForAction.id;
                setSelectedUserForAction(null);
                onNavigateToChat(targetId);
              }}
              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
            >
              <MessageCircle size={16} />
              <span>{t.chats}</span>
            </button>
            <button
              onClick={() => {
                const targetId = selectedUserForAction.id;
                setSelectedUserForAction(null);
                onNavigateToProfile(targetId);
              }}
              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
            >
              <UserAvatar
                avatarUrl={selectedUserForAction.avatarUrl}
                displayName={selectedUserForAction.displayName}
                size={16}
              />
              <span>{t.profile}</span>
            </button>
            <button
              onClick={() => {
                storage.togglePinChat(selectedUserForAction.id);
                setSelectedUserForAction(null);
                loadData();
              }}
              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
            >
              <Pin size={16} />
              <span>
                {storage.getPinnedUserIds().includes(selectedUserForAction.id)
                  ? t.unpinChat
                  : t.pinChat}
              </span>
            </button>
            <button
              onClick={() => {
                storage.toggleFavoriteChat(selectedUserForAction.id);
                setSelectedUserForAction(null);
                loadData();
              }}
              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
            >
              <Star size={16} />
              <span>
                {storage.getFavoriteUserIds().includes(selectedUserForAction.id)
                  ? t.unfavChat
                  : t.favChat}
              </span>
            </button>
            <button
              onClick={() => {
                storage.toggleMuteChat(selectedUserForAction.id);
                setSelectedUserForAction(null);
                loadData();
              }}
              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
            >
              <BellOff size={16} />
              <span>
                {storage.getMutedUserIds().includes(selectedUserForAction.id)
                  ? t.unmuteChat
                  : t.muteChat}
              </span>
            </button>
            <button
              onClick={() => {
                setShowClearChatConfirm(true);
              }}
              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
            >
              <Trash2 size={16} />
              <span>{t.deleteChat}</span>
            </button>
          </div>
        </div>
      )}

      {/* Clear Chat Confirm Modal */}
      <ConfirmModal
        isOpen={showClearChatConfirm}
        title={t.deleteChat}
        message={t.confirmDeleteChat}
        confirmText={t.delete}
        cancelText={t.cancel}
        isDestructive={true}
        onConfirm={handleConfirmClearChat}
        onCancel={() => setShowClearChatConfirm(false)}
      />

      {/* Delete Feed Post Confirm Modal */}
      <ConfirmModal
        isOpen={!!postToDelete}
        title={t.delete}
        message={t.deletePostConfirm}
        confirmText={t.delete}
        cancelText={t.cancel}
        isDestructive={true}
        onConfirm={handleConfirmDeletePost}
        onCancel={() => setPostToDelete(null)}
      />
    </div>
  );
};
