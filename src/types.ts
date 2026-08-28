export type MediaType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'VOICE' | 'AUDIO';
export type ThemeMode = 'DARK' | 'LIGHT' | 'SYSTEM';
export type AppLanguage = 'ARABIC' | 'ENGLISH';
export type CallType = 'VOICE' | 'VIDEO';

export type AppScreen =
  | 'SPLASH'
  | 'AUTH'
  | 'DIRECT_LIST'
  | 'CHAT'
  | 'PROFILE'
  | 'EDIT_PROFILE'
  | 'CREATE_POST'
  | 'CREATE_STORY'
  | 'STORY_VIEWER'
  | 'SETTINGS'
  | 'CALL';

export interface User {
  id: string;
  username: string;
  displayName: string;
  emailOrPhone: string;
  password?: string;
  bio: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeen: number;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  mediaUrl?: string | null;
  mediaType: MediaType;
  timestamp: number;
  isRead: boolean;
  isStarred: boolean;
  replyToMessageId?: string | null;
  replyToText?: string | null;
  replyToSenderName?: string | null;
  isEdited?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatarUrl: string;
  mediaUrl: string;
  mediaType: MediaType;
  caption: string;
  likesCount: number;
  commentsCount: number;
  timestamp: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  userAvatarUrl: string;
  mediaUrl: string;
  mediaType: MediaType;
  caption?: string;
  timestamp: number;
  isViewed?: boolean;
  isCloseFriendsOnly?: boolean;
  viewsCount?: number;
  viewedUserIds?: string[];
}

export interface UserStoryGroup {
  userId: string;
  username: string;
  userAvatarUrl: string;
  stories: Story[];
  hasUnseen: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatarUrl: string;
  text: string;
  timestamp: number;
}

export interface DirectChatSummary {
  user: User;
  lastMessage: Message | null;
  unreadCount: number;
  lastTimestamp: number;
  isPinned: boolean;
  isFavorite: boolean;
  isMuted: boolean;
}

export interface CallSignal {
  id: string;
  fromUserId: string;
  toUserId: string;
  callType: CallType;
  channelId: string;
  status: 'OFFERING' | 'ACCEPTED' | 'REJECTED' | 'ENDED';
  timestamp: number;
}

export interface ActiveCallSession {
  id: string;
  callerId: string;
  receiverId: string;
  callerName: string;
  callerAvatar: string;
  receiverName: string;
  receiverAvatar: string;
  callType: CallType;
  status: 'RINGING' | 'ACCEPTED' | 'REJECTED' | 'ENDED';
  timestamp: number;
}
