import { User, Message, Post, Story, Comment, MediaType, ThemeMode, AppLanguage } from '../types';

const USERS_KEY = 'nt_massage_users';
const MESSAGES_KEY = 'nt_massage_messages';
const POSTS_KEY = 'nt_massage_posts';
const STORIES_KEY = 'nt_massage_stories';
const COMMENTS_KEY = 'nt_massage_comments';
const FOLLOWS_KEY = 'nt_massage_follows';
const CLOSE_FRIENDS_KEY = 'nt_massage_close_friends';
const BLOCKED_USERS_KEY = 'nt_massage_blocked_users';
const SAVED_POSTS_KEY = 'nt_massage_saved_posts';
const STORY_VIEWS_KEY = 'nt_massage_story_views';
const STORY_VIEWERS_KEY = 'nt_massage_story_viewers';
const CURRENT_USER_ID_KEY = 'nt_massage_current_user_id';
const THEME_KEY = 'nt_massage_theme';
const LANG_KEY = 'nt_massage_language';
const HQ_MEDIA_KEY = 'nt_massage_hq_media';
const PINNED_CHATS_KEY = 'nt_massage_pinned_chats';
const FAVORITE_CHATS_KEY = 'nt_massage_fav_chats';
const MUTED_CHATS_KEY = 'nt_massage_muted_chats';

const MOCK_USER_IDS = ['user_ahmed', 'user_noor', 'user_ali'];
const MOCK_POST_IDS = ['post_1', 'post_2'];
const MOCK_STORY_IDS = ['story_1', 'story_2', 'story_3'];
const MOCK_COMMENT_IDS = ['cmt_1'];

class StorageService {
  constructor() {
    this.initStorage();
    this.syncFromServer();
  }

  private initStorage() {
    try {
      const rawUsers = localStorage.getItem(USERS_KEY);
      if (rawUsers) {
        const parsed: User[] = JSON.parse(rawUsers);
        const filtered = parsed.filter((u) => !MOCK_USER_IDS.includes(u.id));
        localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
      } else {
        localStorage.setItem(USERS_KEY, JSON.stringify([]));
      }

      const rawPosts = localStorage.getItem(POSTS_KEY);
      if (rawPosts) {
        const parsed: Post[] = JSON.parse(rawPosts);
        const filtered = parsed.filter((p) => !MOCK_POST_IDS.includes(p.id) && !MOCK_USER_IDS.includes(p.userId));
        localStorage.setItem(POSTS_KEY, JSON.stringify(filtered));
      } else {
        localStorage.setItem(POSTS_KEY, JSON.stringify([]));
      }

      const rawStories = localStorage.getItem(STORIES_KEY);
      if (rawStories) {
        const parsed: Story[] = JSON.parse(rawStories);
        const filtered = parsed.filter((s) => !MOCK_STORY_IDS.includes(s.id) && !MOCK_USER_IDS.includes(s.userId));
        localStorage.setItem(STORIES_KEY, JSON.stringify(filtered));
      } else {
        localStorage.setItem(STORIES_KEY, JSON.stringify([]));
      }

      const rawMsgs = localStorage.getItem(MESSAGES_KEY);
      if (rawMsgs) {
        const parsed: Message[] = JSON.parse(rawMsgs);
        const filtered = parsed.filter((m) => !MOCK_USER_IDS.includes(m.senderId) && !MOCK_USER_IDS.includes(m.receiverId));
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(filtered));
      } else {
        localStorage.setItem(MESSAGES_KEY, JSON.stringify([]));
      }

      const rawComments = localStorage.getItem(COMMENTS_KEY);
      if (rawComments) {
        const parsed: Comment[] = JSON.parse(rawComments);
        const filtered = parsed.filter((c) => !MOCK_COMMENT_IDS.includes(c.id) && !MOCK_USER_IDS.includes(c.userId));
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(filtered));
      } else {
        localStorage.setItem(COMMENTS_KEY, JSON.stringify([]));
      }

      const rawFollows = localStorage.getItem(FOLLOWS_KEY);
      if (rawFollows) {
        const parsed: { followerId: string; followingId: string }[] = JSON.parse(rawFollows);
        const filtered = parsed.filter((f) => !MOCK_USER_IDS.includes(f.followerId) && !MOCK_USER_IDS.includes(f.followingId));
        localStorage.setItem(FOLLOWS_KEY, JSON.stringify(filtered));
      } else {
        localStorage.setItem(FOLLOWS_KEY, JSON.stringify([]));
      }

      const currentUid = localStorage.getItem(CURRENT_USER_ID_KEY);
      if (currentUid && MOCK_USER_IDS.includes(currentUid)) {
        localStorage.removeItem(CURRENT_USER_ID_KEY);
      }
    } catch {
      // Fallback
    }
  }

  // Server Sync
  async syncFromServer(): Promise<boolean> {
    try {
      const currentUid = this.getCurrentUserId();
      const syncUrl = currentUid ? `/api/sync/all?userId=${currentUid}` : '/api/sync/all';
      
      const res = await fetch(syncUrl);
      if (res.ok) {
        const data = await res.json();
        // 1. Sync Users
        if (Array.isArray(data.users)) {
          const localUsers = this.getAllUsers();
          const mergedUsers = data.users.map((u: User) => {
            const local = localUsers.find((l) => l.id === u.id);
            return {
              ...u,
              password: local?.password || u.password || 'Password123',
            };
          });
          localStorage.setItem(USERS_KEY, JSON.stringify(mergedUsers));
        }

        // 2. Sync Posts
        if (Array.isArray(data.posts)) {
          localStorage.setItem(POSTS_KEY, JSON.stringify(data.posts));
        }

        // 3. Sync Stories
        if (Array.isArray(data.stories)) {
          localStorage.setItem(STORIES_KEY, JSON.stringify(data.stories));
          data.stories.forEach((s: Story) => {
            if (Array.isArray(s.viewedUserIds) && s.viewedUserIds.length > 0) {
              const existing = this.getStoryViewerIds(s.id);
              const combined = Array.from(new Set([...existing, ...s.viewedUserIds]));
              localStorage.setItem(`${STORY_VIEWERS_KEY}_${s.id}`, JSON.stringify(combined));
            }
          });
        }

        // 4. Sync Messages
        if (Array.isArray(data.messages)) {
          const localMsgs = this.getAllMessages();
          const map = new Map<string, Message>();
          localMsgs.forEach((m) => map.set(m.id, m));
          data.messages.forEach((m: Message) => map.set(m.id, m));
          const mergedMsgs = Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
          localStorage.setItem(MESSAGES_KEY, JSON.stringify(mergedMsgs));
        }

        // 5. Sync Comments
        if (Array.isArray(data.comments)) {
          localStorage.setItem(COMMENTS_KEY, JSON.stringify(data.comments));
        }

        // 6. Sync Follows
        if (Array.isArray(data.follows)) {
          localStorage.setItem(FOLLOWS_KEY, JSON.stringify(data.follows));
        }

        // 7. Sync Close Friends & Blocked
        if (Array.isArray(data.closeFriends) && currentUid) {
          const myCloseFriends = data.closeFriends
            .filter((c: any) => c.userId === currentUid)
            .map((c: any) => c.targetId);
          localStorage.setItem(`${CLOSE_FRIENDS_KEY}_${currentUid}`, JSON.stringify(myCloseFriends));
        }

        if (Array.isArray(data.blocked) && currentUid) {
          const myBlocked = data.blocked
            .filter((b: any) => b.userId === currentUid)
            .map((b: any) => b.targetId);
          localStorage.setItem(`${BLOCKED_USERS_KEY}_${currentUid}`, JSON.stringify(myBlocked));
        }

        // 8. Send online heartbeat
        if (currentUid) {
          fetch('/api/users/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUid }),
          }).catch(() => {});
        }

        return true;
      }
    } catch {
      // Fallback in case of offline mode
    }
    return false;
  }

  // Auth & Session
  getCurrentUserId(): string | null {
    return localStorage.getItem(CURRENT_USER_ID_KEY);
  }

  setCurrentUserId(id: string | null) {
    if (id) {
      localStorage.setItem(CURRENT_USER_ID_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_USER_ID_KEY);
    }
  }

  setCurrentUser(user: User | null) {
    if (user) {
      this.setCurrentUserId(user.id);
    } else {
      this.setCurrentUserId(null);
    }
  }

  getCurrentUser(): User | null {
    const id = this.getCurrentUserId();
    if (!id) return null;
    return this.getUserById(id);
  }

  // Users
  getAllUsers(): User[] {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  }

  getUserById(id: string): User | null {
    const users = this.getAllUsers();
    const user = users.find((u) => u.id === id);
    if (!user) return null;
    const followers = this.getFollowers(id).length;
    const following = this.getFollowing(id).length;
    const posts = this.getUserPosts(id).length;
    return {
      ...user,
      followersCount: followers,
      followingCount: following,
      postsCount: posts,
    };
  }

  getUserByUsername(username: string): User | null {
    if (!username) return null;
    const clean = username.trim().toLowerCase().replace(/^@+/, '');
    const users = this.getAllUsers();
    const user = users.find((u) => u.username.toLowerCase() === clean);
    if (!user) return null;
    return this.getUserById(user.id);
  }

  getUserByEmail(email: string): User | null {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    const users = this.getAllUsers();
    const user = users.find((u) => u.emailOrPhone.toLowerCase() === clean);
    if (!user) return null;
    return this.getUserById(user.id);
  }

  searchUsers(query: string): User[] {
    const clean = query.trim().toLowerCase().replace(/^@+/, '');
    if (!clean) return [];
    const users = this.getAllUsers();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(clean) ||
        u.displayName.toLowerCase().includes(clean) ||
        u.emailOrPhone.toLowerCase().includes(clean)
    );
  }

  async searchUsersAsync(query: string): Promise<User[]> {
    const clean = query.trim().toLowerCase().replace(/^@+/, '');
    if (!clean) return [];

    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const serverUsers: User[] = await res.json();
        if (Array.isArray(serverUsers) && serverUsers.length > 0) {
          const current = this.getAllUsers();
          const map = new Map<string, User>();
          current.forEach((u) => map.set(u.id, u));
          serverUsers.forEach((su) => {
            const existing = map.get(su.id);
            map.set(su.id, { ...su, password: existing?.password || 'Password123' });
          });
          localStorage.setItem(USERS_KEY, JSON.stringify(Array.from(map.values())));
        }
      }
    } catch {
      // Fallback to local
    }

    return this.searchUsers(clean);
  }

  async registerUser(userData: {
    username: string;
    displayName: string;
    emailOrPhone: string;
    password: string;
    avatarUrl?: string;
    bio?: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanUsername = userData.username.trim().toLowerCase().replace(/^@+/, '');
    const cleanEmail = userData.emailOrPhone.trim().toLowerCase();
    if (!cleanUsername) {
      return { success: false, error: 'اسم المستخدم مطلوب' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'البريد الإلكتروني غير صحيح' };
    }
    if (this.getUserByUsername(cleanUsername)) {
      return { success: false, error: 'اسم المستخدم مسجل مسبقاً' };
    }
    if (this.getUserByEmail(cleanEmail)) {
      return { success: false, error: 'البريد الإلكتروني مسجل مسبقاً' };
    }

    const newUser: User = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      username: cleanUsername,
      displayName: userData.displayName.trim() || cleanUsername,
      emailOrPhone: cleanEmail,
      password: userData.password,
      bio: userData.bio || '',
      avatarUrl:
        userData.avatarUrl ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      isOnline: true,
      lastSeen: Date.now(),
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
    };

    const users = this.getAllUsers();
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    this.setCurrentUserId(newUser.id);

    try {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
    } catch {
      // Local is already saved
    }

    return { success: true, user: newUser };
  }

  async loginUser(
    usernameOrContact: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const raw = usernameOrContact.trim().toLowerCase();
    const cleanNoAt = raw.startsWith('@') ? raw.slice(1) : raw;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: raw, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const userWithPass: User = { ...data.user, password };
          const users = this.getAllUsers();
          const idx = users.findIndex((u) => u.id === userWithPass.id);
          if (idx > -1) users[idx] = userWithPass;
          else users.push(userWithPass);
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
          this.setCurrentUserId(userWithPass.id);
          return { success: true, user: userWithPass };
        }
      }
    } catch {
      // Fallback
    }

    const user =
      this.getUserByEmail(raw) ||
      this.getUserByUsername(cleanNoAt) ||
      this.getUserByUsername(raw) ||
      this.getUserByEmail(cleanNoAt);

    if (!user) {
      return { success: false, error: 'الحساب غير موجود' };
    }
    if (user.password && user.password !== password) {
      return { success: false, error: 'كلمة المرور غير صحيحة!' };
    }
    this.setCurrentUserId(user.id);
    return { success: true, user };
  }

  updateUserProfile(
    userId: string,
    data: { displayName: string; username: string; bio: string; avatarUrl: string }
  ): { success: boolean; user?: User; error?: string } {
    const users = this.getAllUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return { success: false, error: 'المستخدم غير موجود' };

    const cleanUsername = data.username.trim().toLowerCase().replace('@', '');
    const existing = this.getUserByUsername(cleanUsername);
    if (existing && existing.id !== userId) {
      return { success: false, error: `اسم المستخدم @${cleanUsername} مستخدم بالفعل` };
    }

    const updatedUser: User = {
      ...users[index],
      displayName: data.displayName || cleanUsername,
      username: cleanUsername,
      bio: data.bio || '',
      avatarUrl: data.avatarUrl || '',
    };

    users[index] = updatedUser;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Update current user cache if this is current user
    if (this.getCurrentUserId() === userId) {
      this.setCurrentUserId(userId);
    }

    // Propagate avatar & username changes to user's posts
    const posts = this.getAllPosts();
    let postsChanged = false;
    posts.forEach((p) => {
      if (p.userId === userId) {
        p.userAvatarUrl = updatedUser.avatarUrl;
        p.username = cleanUsername;
        postsChanged = true;
      }
    });
    if (postsChanged) {
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    }

    // Propagate avatar & username changes to user's stories
    const stories = this.getAllStories();
    let storiesChanged = false;
    stories.forEach((s) => {
      if (s.userId === userId) {
        s.userAvatarUrl = updatedUser.avatarUrl;
        s.username = cleanUsername;
        storiesChanged = true;
      }
    });
    if (storiesChanged) {
      localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
    }

    fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});

    return { success: true, user: updatedUser };
  }

  changePassword(userId: string, oldPass: string, newPass: string): { success: boolean; error?: string } {
    const users = this.getAllUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return { success: false, error: 'المستخدم غير موجود' };

    if (users[index].password && users[index].password !== oldPass) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
    }
    users[index].password = newPass;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    fetch('/api/users/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, oldPassword: oldPass, newPassword: newPass }),
    }).catch(() => {});
    return { success: true };
  }

  resetPasswordByEmail(email: string, newPass: string): { success: boolean; error?: string } {
    const clean = email.trim().toLowerCase();
    const users = this.getAllUsers();
    const index = users.findIndex((u) => u.emailOrPhone.toLowerCase() === clean);
    if (index === -1) return { success: false, error: 'البريد غير مسجل' };
    users[index].password = newPass;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { success: true };
  }

  // Follows
  getFollows(): { followerId: string; followingId: string }[] {
    const data = localStorage.getItem(FOLLOWS_KEY);
    return data ? JSON.parse(data) : [];
  }

  isFollowing(followerId: string, followingId: string): boolean {
    const follows = this.getFollows();
    return follows.some((f) => f.followerId === followerId && f.followingId === followingId);
  }

  toggleFollow(followerId: string, followingId: string): boolean {
    let follows = this.getFollows();
    const exists = this.isFollowing(followerId, followingId);
    if (exists) {
      follows = follows.filter((f) => !(f.followerId === followerId && f.followingId === followingId));
    } else {
      follows.push({ followerId, followingId });
    }
    localStorage.setItem(FOLLOWS_KEY, JSON.stringify(follows));
    fetch('/api/social/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId, followingId }),
    }).catch(() => {});
    return !exists;
  }

  getFollowers(userId: string): User[] {
    const follows = this.getFollows();
    const followerIds = follows.filter((f) => f.followingId === userId).map((f) => f.followerId);
    const users = this.getAllUsers();
    return users.filter((u) => followerIds.includes(u.id));
  }

  getFollowing(userId: string): User[] {
    const follows = this.getFollows();
    const followingIds = follows.filter((f) => f.followerId === userId).map((f) => f.followingId);
    const users = this.getAllUsers();
    return users.filter((u) => followingIds.includes(u.id));
  }

  // Close Friends
  getCloseFriends(userId: string): string[] {
    const data = localStorage.getItem(`${CLOSE_FRIENDS_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  }

  isCloseFriend(userId: string, targetUserId: string): boolean {
    return this.getCloseFriends(userId).includes(targetUserId);
  }

  toggleCloseFriend(userId: string, targetUserId: string): boolean {
    let friends = this.getCloseFriends(userId);
    const exists = friends.includes(targetUserId);
    if (exists) {
      friends = friends.filter((id) => id !== targetUserId);
    } else {
      friends.push(targetUserId);
    }
    localStorage.setItem(`${CLOSE_FRIENDS_KEY}_${userId}`, JSON.stringify(friends));
    fetch('/api/social/close-friend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetId: targetUserId }),
    }).catch(() => {});
    return !exists;
  }

  // Blocked Users
  getBlockedUsers(userId: string): User[] {
    const data = localStorage.getItem(`${BLOCKED_USERS_KEY}_${userId}`);
    const blockedIds: string[] = data ? JSON.parse(data) : [];
    const users = this.getAllUsers();
    return users.filter((u) => blockedIds.includes(u.id));
  }

  isBlocked(userId: string, targetUserId: string): boolean {
    const myBlocked = localStorage.getItem(`${BLOCKED_USERS_KEY}_${userId}`);
    const myBlockedIds: string[] = myBlocked ? JSON.parse(myBlocked) : [];
    const targetBlocked = localStorage.getItem(`${BLOCKED_USERS_KEY}_${targetUserId}`);
    const targetBlockedIds: string[] = targetBlocked ? JSON.parse(targetBlocked) : [];
    return myBlockedIds.includes(targetUserId) || targetBlockedIds.includes(userId);
  }

  toggleBlockUser(userId: string, targetUserId: string): boolean {
    const data = localStorage.getItem(`${BLOCKED_USERS_KEY}_${userId}`);
    let blockedIds: string[] = data ? JSON.parse(data) : [];
    const exists = blockedIds.includes(targetUserId);
    if (exists) {
      blockedIds = blockedIds.filter((id) => id !== targetUserId);
    } else {
      blockedIds.push(targetUserId);
      let follows = this.getFollows();
      follows = follows.filter(
        (f) =>
          !(
            (f.followerId === userId && f.followingId === targetUserId) ||
            (f.followerId === targetUserId && f.followingId === userId)
          )
      );
      localStorage.setItem(FOLLOWS_KEY, JSON.stringify(follows));
    }
    localStorage.setItem(`${BLOCKED_USERS_KEY}_${userId}`, JSON.stringify(blockedIds));
    fetch('/api/social/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetId: targetUserId }),
    }).catch(() => {});
    return !exists;
  }

  // Messages
  getAllMessages(): Message[] {
    const data = localStorage.getItem(MESSAGES_KEY);
    return data ? JSON.parse(data) : [];
  }

  getMessagesBetween(user1: string, user2: string): Message[] {
    fetch(`/api/messages?user1=${user1}&user2=${user2}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((serverMsgs: Message[]) => {
        if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {
          const all = this.getAllMessages();
          const map = new Map<string, Message>();
          all.forEach((m) => map.set(m.id, m));
          serverMsgs.forEach((m) => map.set(m.id, m));
          localStorage.setItem(MESSAGES_KEY, JSON.stringify(Array.from(map.values())));
        }
      })
      .catch(() => {});

    const all = this.getAllMessages();
    return all
      .filter(
        (m) =>
          (m.senderId === user1 && m.receiverId === user2) ||
          (m.senderId === user2 && m.receiverId === user1)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  getAllUserMessages(userId: string): Message[] {
    fetch('/api/messages')
      .then((res) => (res.ok ? res.json() : []))
      .then((serverMsgs: Message[]) => {
        if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {
          const all = this.getAllMessages();
          const map = new Map<string, Message>();
          all.forEach((m) => map.set(m.id, m));
          serverMsgs.forEach((m) => map.set(m.id, m));
          localStorage.setItem(MESSAGES_KEY, JSON.stringify(Array.from(map.values())));
        }
      })
      .catch(() => {});

    const all = this.getAllMessages();
    return all.filter((m) => m.senderId === userId || m.receiverId === userId);
  }

  sendMessage(msg: Omit<Message, 'id' | 'timestamp' | 'isRead' | 'isStarred'>): Message {
    const all = this.getAllMessages();
    const newMsgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newMsg: Message = {
      ...msg,
      id: newMsgId,
      timestamp: Date.now(),
      isRead: false,
      isStarred: false,
    };
    all.push(newMsg);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg),
    }).catch(() => {});
    return newMsg;
  }

  markMessagesAsRead(senderId: string, receiverId: string) {
    const all = this.getAllMessages();
    let updated = false;
    all.forEach((m) => {
      if (m.senderId === senderId && m.receiverId === receiverId && !m.isRead) {
        m.isRead = true;
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
      fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId, receiverId }),
      }).catch(() => {});
    }
  }

  toggleStarredMessage(messageId: string): boolean {
    const all = this.getAllMessages();
    const msg = all.find((m) => m.id === messageId);
    if (msg) {
      msg.isStarred = !msg.isStarred;
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
      return msg.isStarred;
    }
    return false;
  }

  editMessage(messageId: string, newText: string) {
    const all = this.getAllMessages();
    const msg = all.find((m) => m.id === messageId);
    if (msg) {
      msg.text = newText;
      msg.isEdited = true;
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
      fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText }),
      }).catch(() => {});
    }
  }

  deleteMessage(messageId: string) {
    let all = this.getAllMessages();
    all = all.filter((m) => m.id !== messageId);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
    fetch(`/api/messages/${messageId}`, { method: 'DELETE' }).catch(() => {});
  }

  clearConversation(user1: string, user2: string) {
    let all = this.getAllMessages();
    all = all.filter(
      (m) =>
        !(
          (m.senderId === user1 && m.receiverId === user2) ||
          (m.senderId === user2 && m.receiverId === user1)
        )
    );
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
  }

  clearChatWithUser(user1: string, user2: string) {
    this.clearConversation(user1, user2);
  }

  // Pinned / Favorite / Muted Direct Chats
  getPinnedUserIds(): string[] {
    const data = localStorage.getItem(PINNED_CHATS_KEY);
    return data ? JSON.parse(data) : [];
  }

  togglePinChat(userId: string): boolean {
    let ids = this.getPinnedUserIds();
    const exists = ids.includes(userId);
    if (exists) ids = ids.filter((id) => id !== userId);
    else ids.push(userId);
    localStorage.setItem(PINNED_CHATS_KEY, JSON.stringify(ids));
    return !exists;
  }

  getFavoriteUserIds(): string[] {
    const data = localStorage.getItem(FAVORITE_CHATS_KEY);
    return data ? JSON.parse(data) : [];
  }

  toggleFavoriteChat(userId: string): boolean {
    let ids = this.getFavoriteUserIds();
    const exists = ids.includes(userId);
    if (exists) ids = ids.filter((id) => id !== userId);
    else ids.push(userId);
    localStorage.setItem(FAVORITE_CHATS_KEY, JSON.stringify(ids));
    return !exists;
  }

  getMutedUserIds(): string[] {
    const data = localStorage.getItem(MUTED_CHATS_KEY);
    return data ? JSON.parse(data) : [];
  }

  toggleMuteChat(userId: string): boolean {
    let ids = this.getMutedUserIds();
    const exists = ids.includes(userId);
    if (exists) ids = ids.filter((id) => id !== userId);
    else ids.push(userId);
    localStorage.setItem(MUTED_CHATS_KEY, JSON.stringify(ids));
    return !exists;
  }

  // Posts
  getAllPosts(): Post[] {
    const data = localStorage.getItem(POSTS_KEY);
    const posts: Post[] = data ? JSON.parse(data) : [];
    const currentUid = this.getCurrentUserId();
    const savedPostIds = this.getSavedPostIds(currentUid || '');
    return posts
      .map((p) => {
        const comments = this.getCommentsForPost(p.id);
        return {
          ...p,
          commentsCount: comments.length,
          isSaved: savedPostIds.includes(p.id),
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getUserPosts(userId: string): Post[] {
    return this.getAllPosts().filter((p) => p.userId === userId);
  }

  createPost(post: Omit<Post, 'id' | 'timestamp' | 'likesCount' | 'commentsCount' | 'isLiked'>): Post {
    const posts = this.getAllPosts();
    const newPost: Post = {
      ...post,
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
    };
    posts.unshift(newPost);
    try {
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    } catch (e) {
      console.warn('LocalStorage quota warning in createPost, trimming:', e);
      try {
        localStorage.setItem(POSTS_KEY, JSON.stringify(posts.slice(0, 30)));
      } catch {}
    }
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost),
    }).catch(() => {});
    return newPost;
  }

  togglePostLike(postId: string): boolean {
    const posts = this.getAllPosts();
    const post = posts.find((p) => p.id === postId);
    const currentUserId = this.getCurrentUserId();
    if (post && currentUserId) {
      post.isLiked = !post.isLiked;
      post.likesCount = post.isLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
      fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      }).catch(() => {});
      return post.isLiked;
    }
    return false;
  }

  updatePostCaption(postId: string, newCaption: string) {
    const posts = this.getAllPosts();
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.caption = newCaption;
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
      fetch(`/api/posts/${postId}/caption`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: newCaption }),
      }).catch(() => {});
    }
  }

  deletePost(postId: string) {
    let posts = this.getAllPosts();
    posts = posts.filter((p) => p.id !== postId);
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    fetch(`/api/posts/${postId}`, { method: 'DELETE' }).catch(() => {});
  }

  // Saved Posts
  getSavedPostIds(userId: string): string[] {
    if (!userId) return [];
    const data = localStorage.getItem(`${SAVED_POSTS_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  }

  toggleSavePost(userId: string, postId: string): boolean {
    let saved = this.getSavedPostIds(userId);
    const exists = saved.includes(postId);
    if (exists) {
      saved = saved.filter((id) => id !== postId);
    } else {
      saved.push(postId);
    }
    localStorage.setItem(`${SAVED_POSTS_KEY}_${userId}`, JSON.stringify(saved));
    return !exists;
  }

  getSavedPosts(userId: string): Post[] {
    const savedIds = this.getSavedPostIds(userId);
    return this.getAllPosts().filter((p) => savedIds.includes(p.id));
  }

  // Comments
  getAllComments(): Comment[] {
    const data = localStorage.getItem(COMMENTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  getCommentsForPost(postId: string): Comment[] {
    const all = this.getAllComments();
    return all.filter((c) => c.postId === postId).sort((a, b) => a.timestamp - b.timestamp);
  }

  addComment(comment: Omit<Comment, 'id' | 'timestamp'>): Comment {
    const all = this.getAllComments();
    const newComment: Comment = {
      ...comment,
      id: 'cmt_' + Date.now(),
      timestamp: Date.now(),
    };
    all.push(newComment);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
    fetch(`/api/posts/${comment.postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: comment.userId, text: comment.text }),
    }).catch(() => {});
    return newComment;
  }

  deleteComment(commentId: string, postId?: string) {
    let all = this.getAllComments();
    all = all.filter((c) => c.id !== commentId);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
    if (postId) {
      fetch(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }).catch(() => {});
    }
  }

  // Stories
  getAllStories(): Story[] {
    const data = localStorage.getItem(STORIES_KEY);
    return data ? JSON.parse(data) : [];
  }

  getActiveStories(): Story[] {
    const stories: Story[] = this.getAllStories();
    const minTime = Date.now() - 24 * 3600 * 1000;
    const currentUid = this.getCurrentUserId();
    const viewedIds = this.getViewedStoryIds(currentUid || '');
    return stories
      .filter((s) => s.timestamp >= minTime)
      .map((s) => {
        const viewerIds = this.getStoryViewerIds(s.id);
        return {
          ...s,
          isViewed: viewedIds.includes(s.id),
          viewedUserIds: viewerIds,
          viewsCount: viewerIds.length,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  getUserStories(userId: string): Story[] {
    return this.getActiveStories().filter((s) => s.userId === userId);
  }

  createStory(story: {
    userId: string;
    username: string;
    userAvatarUrl: string;
    mediaUrl: string;
    mediaType: MediaType;
    caption?: string;
    isCloseFriendsOnly?: boolean;
  }): Story {
    const data = localStorage.getItem(STORIES_KEY);
    const stories: Story[] = data ? JSON.parse(data) : [];
    const newStory: Story = {
      id: 'story_' + Date.now(),
      userId: story.userId,
      username: story.username,
      userAvatarUrl: story.userAvatarUrl,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption || '',
      isCloseFriendsOnly: !!story.isCloseFriendsOnly,
      timestamp: Date.now(),
      isViewed: false,
      viewedUserIds: [],
    };
    stories.push(newStory);
    try {
      localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
    } catch (e) {
      console.warn('LocalStorage quota in createStory:', e);
      try {
        localStorage.setItem(STORIES_KEY, JSON.stringify(stories.slice(-20)));
      } catch {}
    }
    fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: story.userId,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
      }),
    }).catch(() => {});
    return newStory;
  }

  deleteStory(storyId: string) {
    const data = localStorage.getItem(STORIES_KEY);
    let stories: Story[] = data ? JSON.parse(data) : [];
    stories = stories.filter((s) => s.id !== storyId);
    localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
    fetch(`/api/stories/${storyId}`, { method: 'DELETE' }).catch(() => {});
  }

  getViewedStoryIds(userId: string): string[] {
    if (!userId) return [];
    const data = localStorage.getItem(`${STORY_VIEWS_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  }

  getStoryViewerIds(storyId: string): string[] {
    if (!storyId) return [];
    const data = localStorage.getItem(`${STORY_VIEWERS_KEY}_${storyId}`);
    return data ? JSON.parse(data) : [];
  }

  getStoryViewers(storyId: string): User[] {
    const viewerIds = this.getStoryViewerIds(storyId);
    const users: User[] = [];
    viewerIds.forEach((uid) => {
      const u = this.getUserById(uid);
      if (u) users.push(u);
    });
    return users;
  }

  markStoryViewed(storyId: string, viewerUserId: string) {
    if (!viewerUserId || !storyId) return;
    const viewed = this.getViewedStoryIds(viewerUserId);
    if (!viewed.includes(storyId)) {
      viewed.push(storyId);
      localStorage.setItem(`${STORY_VIEWS_KEY}_${viewerUserId}`, JSON.stringify(viewed));
    }
    const storyViewers = this.getStoryViewerIds(storyId);
    if (!storyViewers.includes(viewerUserId)) {
      storyViewers.push(viewerUserId);
      localStorage.setItem(`${STORY_VIEWERS_KEY}_${storyId}`, JSON.stringify(storyViewers));
    }
    fetch(`/api/stories/${storyId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: viewerUserId }),
    }).catch(() => {});
  }

  init() {
    this.initStorage();
    this.syncFromServer();
  }

  logout() {
    this.setCurrentUserId(null);
  }

  // Preferences
  getTheme(): ThemeMode {
    return this.getThemeMode();
  }

  setTheme(mode: ThemeMode) {
    this.applyTheme(mode);
  }

  getThemeMode(): ThemeMode {
    return (localStorage.getItem(THEME_KEY) as ThemeMode) || 'DARK';
  }

  setThemeMode(mode: ThemeMode) {
    localStorage.setItem(THEME_KEY, mode);
  }

  applyTheme(mode: ThemeMode) {
    this.setThemeMode(mode);
    if (typeof document !== 'undefined') {
      if (mode === 'LIGHT') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    }
  }

  getLanguage(): AppLanguage {
    return (localStorage.getItem(LANG_KEY) as AppLanguage) || 'ARABIC';
  }

  setLanguage(lang: AppLanguage) {
    localStorage.setItem(LANG_KEY, lang);
  }

  getHighQualityMedia(): boolean {
    const val = localStorage.getItem(HQ_MEDIA_KEY);
    return val === null ? true : val === 'true';
  }

  setHighQualityMedia(enabled: boolean) {
    localStorage.setItem(HQ_MEDIA_KEY, String(enabled));
  }

  // Alias for createStory
  addStory(story: {
    userId: string;
    username: string;
    userAvatarUrl: string;
    mediaUrl: string;
    mediaType: MediaType;
    caption?: string;
    isCloseFriendsOnly?: boolean;
  }): Story {
    return this.createStory(story);
  }

  // Sound & Vibration & Push Notifications Settings
  isSoundEnabled(): boolean {
    const v = localStorage.getItem('nt_massage_sound_enabled');
    return v === null ? true : v === 'true';
  }

  setSoundEnabled(enabled: boolean) {
    localStorage.setItem('nt_massage_sound_enabled', String(enabled));
  }

  isVibrationEnabled(): boolean {
    const v = localStorage.getItem('nt_massage_vibration_enabled');
    return v === null ? true : v === 'true';
  }

  setVibrationEnabled(enabled: boolean) {
    localStorage.setItem('nt_massage_vibration_enabled', String(enabled));
  }

  isPushNotificationEnabled(): boolean {
    const v = localStorage.getItem('nt_massage_push_enabled');
    return v === null ? true : v === 'true';
  }

  setPushNotificationEnabled(enabled: boolean) {
    localStorage.setItem('nt_massage_push_enabled', String(enabled));
  }

  isPrivacyLockEnabled(): boolean {
    const v = localStorage.getItem('nt_massage_privacy_lock');
    return v === 'true';
  }

  setPrivacyLockEnabled(enabled: boolean) {
    localStorage.setItem('nt_massage_privacy_lock', String(enabled));
  }

  // Data Export & Reset
  exportAllData(): string {
    const payload = {
      users: this.getAllUsers(),
      messages: this.getAllMessages(),
      posts: this.getAllPosts(),
      stories: this.getActiveStories(),
      comments: this.getAllComments(),
      follows: this.getFollows(),
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(payload, null, 2);
  }

  clearAllData() {
    localStorage.clear();
    this.initStorage();
  }

  deleteAccount(userId: string) {
    let users = this.getAllUsers();
    users = users.filter((u) => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    if (this.getCurrentUserId() === userId) {
      this.setCurrentUserId(null);
    }
  }

  // Real-time Call Signaling
  initiateCall(fromUserId: string, toUserId: string, callType: 'VOICE' | 'VIDEO'): string {
    const channelId = 'call_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const caller = this.getUserById(fromUserId);
    const receiver = this.getUserById(toUserId);
    const signal = {
      id: channelId,
      callerId: fromUserId,
      receiverId: toUserId,
      fromUserId,
      toUserId,
      callerName: caller?.displayName || 'User',
      callerAvatar: caller?.avatarUrl || '',
      receiverName: receiver?.displayName || 'User',
      receiverAvatar: receiver?.avatarUrl || '',
      callType,
      channelId,
      status: 'RINGING',
      timestamp: Date.now(),
    };

    const key = `nt_massage_calls_${toUserId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(signal);
    localStorage.setItem(key, JSON.stringify(existing));

    // Also notify server for cross-device / online delivery
    fetch('/api/calls/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callerId: fromUserId,
        receiverId: toUserId,
        callerName: caller?.displayName || 'User',
        callerAvatar: caller?.avatarUrl || '',
        receiverName: receiver?.displayName || 'User',
        receiverAvatar: receiver?.avatarUrl || '',
        callType,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.call?.id) {
          localStorage.setItem('nt_massage_active_call_id', data.call.id);
        }
      })
      .catch(() => {});

    localStorage.setItem('nt_massage_active_call_id', channelId);
    return channelId;
  }

  getIncomingCalls(userId: string): any[] {
    if (!userId) return [];
    // Async poll server in background
    fetch(`/api/calls?userId=${userId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((serverCalls: any[]) => {
        if (Array.isArray(serverCalls)) {
          const key = `nt_massage_calls_${userId}`;
          const mapped = serverCalls.map((c) => ({
            id: c.id,
            channelId: c.id,
            fromUserId: c.callerId,
            toUserId: c.receiverId,
            callerId: c.callerId,
            receiverId: c.receiverId,
            callType: c.callType,
            status: c.status === 'RINGING' ? 'OFFERING' : c.status,
            timestamp: c.timestamp,
          }));
          localStorage.setItem(key, JSON.stringify(mapped));
        }
      })
      .catch(() => {});

    const key = `nt_massage_calls_${userId}`;
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const valid = list.filter(
      (c: any) =>
        (c.status === 'OFFERING' || c.status === 'RINGING') &&
        Date.now() - c.timestamp < 60000 &&
        (c.toUserId === userId || c.receiverId === userId)
    );
    return valid;
  }

  acceptCall(channelId: string) {
    const currentUid = this.getCurrentUserId();
    if (!currentUid) return;
    const key = `nt_massage_calls_${currentUid}`;
    let list = JSON.parse(localStorage.getItem(key) || '[]');
    list = list.map((c: any) =>
      c.channelId === channelId || c.id === channelId ? { ...c, status: 'ACCEPTED' } : c
    );
    localStorage.setItem(key, JSON.stringify(list));

    fetch('/api/calls/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId: channelId, action: 'ACCEPT' }),
    }).catch(() => {});
  }

  rejectCall(channelId: string) {
    const currentUid = this.getCurrentUserId();
    if (!currentUid) return;
    const key = `nt_massage_calls_${currentUid}`;
    let list = JSON.parse(localStorage.getItem(key) || '[]');
    list = list.filter((c: any) => c.channelId !== channelId && c.id !== channelId);
    localStorage.setItem(key, JSON.stringify(list));

    fetch('/api/calls/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId: channelId, action: 'REJECT' }),
    }).catch(() => {});
  }

  endCall(channelId: string) {
    const currentUid = this.getCurrentUserId();
    if (currentUid) {
      const key = `nt_massage_calls_${currentUid}`;
      let list = JSON.parse(localStorage.getItem(key) || '[]');
      list = list.filter((c: any) => c.channelId !== channelId && c.id !== channelId);
      localStorage.setItem(key, JSON.stringify(list));
    }
    localStorage.removeItem('nt_massage_active_call_id');

    fetch('/api/calls/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId: channelId, action: 'END' }),
    }).catch(() => {});
  }

  endAllUserCalls(userId: string) {
    localStorage.removeItem(`nt_massage_calls_${userId}`);
    localStorage.removeItem('nt_massage_active_call_id');
  }
}

export const storage = new StorageService();
