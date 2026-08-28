import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set up public uploads directory
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up Multer for media uploads
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.startsWith('video') ? '.mp4' : '.jpg');
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storageConfig,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// File-backed Store for multi-client / persistence support across real devices
const dataFilePath = path.join(process.cwd(), 'public', 'uploads', 'server-data.json');

let serverUsers: any[] = [];
let serverMessages: any[] = [];
let serverPosts: any[] = [];
let serverStories: any[] = [];
let serverComments: any[] = [];
let serverFollows: { followerId: string; followingId: string }[] = [];
let serverLikes: { postId: string; userId: string }[] = [];
let serverCloseFriends: { userId: string; targetId: string }[] = [];
let serverBlocked: { userId: string; targetId: string }[] = [];

try {
  if (fs.existsSync(dataFilePath)) {
    const raw = fs.readFileSync(dataFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    serverUsers = parsed.users || [];
    serverMessages = parsed.messages || [];
    serverPosts = parsed.posts || [];
    serverStories = parsed.stories || [];
    serverComments = parsed.comments || [];
    serverFollows = parsed.follows || [];
    serverLikes = parsed.likes || [];
    serverCloseFriends = parsed.closeFriends || [];
    serverBlocked = parsed.blocked || [];
  }
} catch {
  serverUsers = [];
  serverMessages = [];
  serverPosts = [];
  serverStories = [];
  serverComments = [];
  serverFollows = [];
  serverLikes = [];
  serverCloseFriends = [];
  serverBlocked = [];
}

function saveServerData() {
  try {
    const payload = {
      users: serverUsers,
      messages: serverMessages,
      posts: serverPosts,
      stories: serverStories,
      comments: serverComments,
      follows: serverFollows,
      likes: serverLikes,
      closeFriends: serverCloseFriends,
      blocked: serverBlocked,
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving server-data.json:', err);
  }
}

// User & Auth Routes
app.get('/api/users', (req, res) => {
  const usersWithCounts = serverUsers.map((u) => {
    const followers = serverFollows.filter((f) => f.followingId === u.id).length;
    const following = serverFollows.filter((f) => f.followerId === u.id).length;
    const posts = serverPosts.filter((p) => p.userId === u.id).length;
    return {
      ...u,
      password: u.password || 'Password123',
      followersCount: followers,
      followingCount: following,
      postsCount: posts,
    };
  });
  res.json(usersWithCounts);
});

app.post('/api/auth/register', (req, res) => {
  const { username, displayName, emailOrPhone, password, avatarUrl, bio } = req.body;
  if (!username || !emailOrPhone) {
    return res.status(400).json({ error: 'اسم المستخدم والبريد الإلكتروني مطلوبان' });
  }
  const cleanUsername = String(username).trim().toLowerCase().replace(/^@+/, '');
  const cleanEmail = String(emailOrPhone).trim().toLowerCase();

  const existing = serverUsers.find(
    (u) => u.username.toLowerCase() === cleanUsername || u.emailOrPhone.toLowerCase() === cleanEmail
  );
  if (existing) {
    return res.status(400).json({ error: 'اسم المستخدم أو البريد مسجل مسبقاً' });
  }

  const newUser = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    username: cleanUsername,
    displayName: displayName?.trim() || cleanUsername,
    emailOrPhone: cleanEmail,
    password: password || 'Password123',
    bio: bio || '',
    avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    isOnline: true,
    lastSeen: Date.now(),
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
  };

  serverUsers.push(newUser);
  saveServerData();
  return res.json({ success: true, user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم أو البريد' });
  }
  const raw = String(identifier).trim().toLowerCase();
  const cleanNoAt = raw.startsWith('@') ? raw.slice(1) : raw;

  const user = serverUsers.find(
    (u) =>
      u.emailOrPhone?.toLowerCase() === raw ||
      u.username?.toLowerCase() === cleanNoAt ||
      u.username?.toLowerCase() === raw ||
      u.emailOrPhone?.toLowerCase() === cleanNoAt
  );

  if (!user) {
    return res.status(404).json({ error: 'الحساب غير موجود' });
  }

  if (password && user.password && user.password !== password) {
    return res.status(401).json({ error: 'كلمة المرور غير صحيحة!' });
  }

  const followers = serverFollows.filter((f) => f.followingId === user.id).length;
  const following = serverFollows.filter((f) => f.followerId === user.id).length;
  const posts = serverPosts.filter((p) => p.userId === user.id).length;

  return res.json({
    success: true,
    user: { ...user, followersCount: followers, followingCount: following, postsCount: posts },
  });
});

app.get('/api/users/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase().replace(/^@+/, '');
  if (!q) return res.json([]);
  const matched = serverUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.emailOrPhone.toLowerCase().includes(q)
  );
  return res.json(matched);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const idx = serverUsers.findIndex((u) => u.id === id);
  if (idx !== -1) {
    serverUsers[idx] = { ...serverUsers[idx], ...req.body };
    saveServerData();
    return res.json({ success: true, user: serverUsers[idx] });
  }
  return res.status(404).json({ error: 'User not found' });
});

app.post('/api/users/change-password', (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  const user = serverUsers.find((u) => u.id === userId);
  if (user) {
    if (user.password && user.password !== oldPassword) {
      return res.status(400).json({ error: 'كلمة المرور القديمة غير صحيحة' });
    }
    user.password = newPassword;
    saveServerData();
    return res.json({ success: true });
  }
  return res.status(404).json({ error: 'User not found' });
});

// Messages Routes
app.get('/api/messages', (req, res) => {
  const { user1, user2 } = req.query;
  if (user1 && user2) {
    const u1 = String(user1);
    const u2 = String(user2);
    const msgs = serverMessages.filter(
      (m) => (m.senderId === u1 && m.receiverId === u2) || (m.senderId === u2 && m.receiverId === u1)
    );
    return res.json(msgs);
  }
  return res.json(serverMessages);
});

app.post('/api/messages', (req, res) => {
  const msg = req.body;
  if (!msg || !msg.senderId || !msg.receiverId) {
    return res.status(400).json({ error: 'Invalid message payload' });
  }
  const existingIdx = serverMessages.findIndex((m) => m.id === msg.id);
  if (existingIdx !== -1) {
    serverMessages[existingIdx] = { ...serverMessages[existingIdx], ...msg };
  } else {
    serverMessages.push(msg);
  }
  saveServerData();
  return res.json({ success: true, message: msg });
});

app.post('/api/messages/read', (req, res) => {
  const { senderId, receiverId } = req.body;
  let updated = false;
  serverMessages.forEach((m) => {
    if (m.senderId === senderId && m.receiverId === receiverId) {
      m.isRead = true;
      updated = true;
    }
  });
  if (updated) saveServerData();
  return res.json({ success: true });
});

app.put('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const msg = serverMessages.find((m) => m.id === id);
  if (msg) {
    msg.text = text;
    msg.isEdited = true;
    saveServerData();
    return res.json({ success: true, message: msg });
  }
  return res.status(404).json({ error: 'Message not found' });
});

app.delete('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  serverMessages = serverMessages.filter((m) => m.id !== id);
  saveServerData();
  return res.json({ success: true });
});

// Posts Routes
app.get('/api/posts', (req, res) => {
  const { userId } = req.query;
  const enrichedPosts = serverPosts.map((post) => {
    const postLikes = serverLikes.filter((l) => l.postId === post.id);
    const postComments = serverComments.filter((c) => c.postId === post.id);
    const isLiked = userId ? postLikes.some((l) => l.userId === userId) : false;
    return {
      ...post,
      likesCount: postLikes.length || post.likesCount || 0,
      commentsCount: postComments.length,
      isLiked,
    };
  });
  res.json(enrichedPosts.sort((a, b) => b.timestamp - a.timestamp));
});

app.post('/api/posts', (req, res) => {
  const newPost = req.body;
  if (!newPost || !newPost.userId) {
    return res.status(400).json({ error: 'Invalid post data' });
  }
  const existingIdx = serverPosts.findIndex((p) => p.id === newPost.id);
  if (existingIdx !== -1) {
    serverPosts[existingIdx] = { ...serverPosts[existingIdx], ...newPost };
  } else {
    serverPosts.unshift(newPost);
  }
  saveServerData();
  return res.json({ success: true, post: newPost });
});

app.put('/api/posts/:id/caption', (req, res) => {
  const { id } = req.params;
  const { caption } = req.body;
  const post = serverPosts.find((p) => p.id === id);
  if (post) {
    post.caption = caption;
    saveServerData();
    return res.json({ success: true, post });
  }
  return res.status(404).json({ error: 'Post not found' });
});

app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  serverPosts = serverPosts.filter((p) => p.id !== id);
  serverComments = serverComments.filter((c) => c.postId !== id);
  serverLikes = serverLikes.filter((l) => l.postId !== id);
  saveServerData();
  return res.json({ success: true });
});

app.post('/api/posts/:id/like', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const existingIdx = serverLikes.findIndex((l) => l.postId === id && l.userId === userId);
  let isLiked = false;
  if (existingIdx !== -1) {
    serverLikes.splice(existingIdx, 1);
    isLiked = false;
  } else {
    serverLikes.push({ postId: id, userId });
    isLiked = true;
  }
  const post = serverPosts.find((p) => p.id === id);
  if (post) {
    post.likesCount = serverLikes.filter((l) => l.postId === id).length;
  }
  saveServerData();
  return res.json({ success: true, isLiked, likesCount: post?.likesCount || 0 });
});

// Comments Routes
app.get('/api/comments', (req, res) => {
  const { postId } = req.query;
  if (postId) {
    return res.json(serverComments.filter((c) => c.postId === String(postId)));
  }
  return res.json(serverComments);
});

app.get('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const comments = serverComments.filter((c) => c.postId === id);
  return res.json(comments.sort((a, b) => a.timestamp - b.timestamp));
});

app.post('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const { userId, text, id: commentId, timestamp } = req.body;
  if (!userId || !text) {
    return res.status(400).json({ error: 'User ID and text required' });
  }
  const user = serverUsers.find((u) => u.id === userId);
  const newComment = {
    id: commentId || 'cmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    postId: id,
    userId,
    username: user?.username || 'user',
    userAvatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    text,
    timestamp: timestamp || Date.now(),
  };
  serverComments.push(newComment);
  saveServerData();
  return res.json({ success: true, comment: newComment });
});

app.delete('/api/posts/:id/comments/:commentId', (req, res) => {
  const { commentId } = req.params;
  serverComments = serverComments.filter((c) => c.id !== commentId);
  saveServerData();
  return res.json({ success: true });
});

// Stories Routes
app.get('/api/stories', (req, res) => {
  const minTime = Date.now() - 24 * 3600 * 1000;
  const activeStories = serverStories.filter((s) => s.timestamp >= minTime);
  res.json(activeStories.sort((a, b) => a.timestamp - b.timestamp));
});

app.post('/api/stories', (req, res) => {
  const newStory = req.body;
  if (!newStory || !newStory.userId) {
    return res.status(400).json({ error: 'Invalid story payload' });
  }
  const user = serverUsers.find((u) => u.id === newStory.userId);
  const storyObj = {
    ...newStory,
    id: newStory.id || 'story_' + Date.now(),
    username: user?.username || newStory.username || 'user',
    userAvatarUrl: user?.avatarUrl || newStory.userAvatarUrl || '',
    timestamp: newStory.timestamp || Date.now(),
    viewedUserIds: newStory.viewedUserIds || [],
  };
  const existingIdx = serverStories.findIndex((s) => s.id === storyObj.id);
  if (existingIdx !== -1) {
    serverStories[existingIdx] = storyObj;
  } else {
    serverStories.push(storyObj);
  }
  saveServerData();
  return res.json({ success: true, story: storyObj });
});

app.delete('/api/stories/:id', (req, res) => {
  const { id } = req.params;
  serverStories = serverStories.filter((s) => s.id !== id);
  saveServerData();
  return res.json({ success: true });
});

app.post('/api/stories/:id/view', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const story = serverStories.find((s) => s.id === id);
  if (story && userId) {
    if (!Array.isArray(story.viewedUserIds)) {
      story.viewedUserIds = [];
    }
    if (!story.viewedUserIds.includes(userId)) {
      story.viewedUserIds.push(userId);
      saveServerData();
    }
    return res.json({ success: true, viewedUserIds: story.viewedUserIds });
  }
  return res.json({ success: true });
});

app.get('/api/stories/:id/viewers', (req, res) => {
  const { id } = req.params;
  const story = serverStories.find((s) => s.id === id);
  if (story && Array.isArray(story.viewedUserIds)) {
    const viewers = serverUsers.filter((u) => story.viewedUserIds.includes(u.id));
    return res.json(viewers);
  }
  return res.json([]);
});

// Social Routes (Follow, Close Friends, Block)
app.get('/api/social/follows', (req, res) => {
  res.json(serverFollows);
});

app.post('/api/social/follow', (req, res) => {
  const { followerId, followingId } = req.body;
  if (!followerId || !followingId) {
    return res.status(400).json({ error: 'Missing followerId or followingId' });
  }
  const existingIdx = serverFollows.findIndex(
    (f) => f.followerId === followerId && f.followingId === followingId
  );
  let isFollowing = false;
  if (existingIdx !== -1) {
    serverFollows.splice(existingIdx, 1);
    isFollowing = false;
  } else {
    serverFollows.push({ followerId, followingId });
    isFollowing = true;
  }
  saveServerData();
  return res.json({ success: true, isFollowing });
});

app.post('/api/social/close-friend', (req, res) => {
  const { userId, targetId } = req.body;
  const idx = serverCloseFriends.findIndex((c) => c.userId === userId && c.targetId === targetId);
  let isClose = false;
  if (idx !== -1) {
    serverCloseFriends.splice(idx, 1);
  } else {
    serverCloseFriends.push({ userId, targetId });
    isClose = true;
  }
  saveServerData();
  return res.json({ success: true, isClose });
});

app.post('/api/social/block', (req, res) => {
  const { userId, targetId } = req.body;
  const idx = serverBlocked.findIndex((b) => b.userId === userId && b.targetId === targetId);
  let isBlocked = false;
  if (idx !== -1) {
    serverBlocked.splice(idx, 1);
  } else {
    serverBlocked.push({ userId, targetId });
    serverFollows = serverFollows.filter(
      (f) =>
        !(
          (f.followerId === userId && f.followingId === targetId) ||
          (f.followerId === targetId && f.followingId === userId)
        )
    );
    isBlocked = true;
  }
  saveServerData();
  return res.json({ success: true, isBlocked });
});

// Full Instant Sync Route (One request to get latest of everything)
app.get('/api/sync/all', (req, res) => {
  const { userId } = req.query;
  const minStoryTime = Date.now() - 24 * 3600 * 1000;
  const activeStories = serverStories.filter((s) => s.timestamp >= minStoryTime);

  const usersWithCounts = serverUsers.map((u) => {
    const followers = serverFollows.filter((f) => f.followingId === u.id).length;
    const following = serverFollows.filter((f) => f.followerId === u.id).length;
    const posts = serverPosts.filter((p) => p.userId === u.id).length;
    return {
      ...u,
      password: u.password || 'Password123',
      followersCount: followers,
      followingCount: following,
      postsCount: posts,
    };
  });

  const enrichedPosts = serverPosts.map((post) => {
    const postLikes = serverLikes.filter((l) => l.postId === post.id);
    const postComments = serverComments.filter((c) => c.postId === post.id);
    const isLiked = userId ? postLikes.some((l) => l.userId === String(userId)) : false;
    return {
      ...post,
      likesCount: postLikes.length || post.likesCount || 0,
      commentsCount: postComments.length,
      isLiked,
    };
  });

  res.json({
    users: usersWithCounts,
    posts: enrichedPosts.sort((a, b) => b.timestamp - a.timestamp),
    stories: activeStories.sort((a, b) => a.timestamp - b.timestamp),
    messages: serverMessages,
    comments: serverComments,
    follows: serverFollows,
    likes: serverLikes,
    closeFriends: serverCloseFriends,
    blocked: serverBlocked,
  });
});

app.post('/api/users/heartbeat', (req, res) => {
  const { userId } = req.body;
  if (userId) {
    const user = serverUsers.find((u) => u.id === userId);
    if (user) {
      user.isOnline = true;
      user.lastSeen = Date.now();
    }
  }
  res.json({ success: true });
});

// Call Signaling Routes
let activeCallSessions: any[] = [];

app.get('/api/calls', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.json(activeCallSessions);
  const now = Date.now();
  // Filter out calls older than 90 seconds that are still RINGING
  activeCallSessions = activeCallSessions.filter((c) => now - c.timestamp < 90000 || c.status === 'ACCEPTED');
  const userCalls = activeCallSessions.filter(
    (c) => (c.receiverId === userId || c.callerId === userId) && c.status !== 'ENDED' && c.status !== 'REJECTED'
  );
  return res.json(userCalls);
});

app.post('/api/calls/start', (req, res) => {
  const { callerId, receiverId, callerName, callerAvatar, receiverName, receiverAvatar, callType } = req.body;
  if (!callerId || !receiverId) {
    return res.status(400).json({ error: 'Missing caller or receiver ID' });
  }

  // End any existing session between these users
  activeCallSessions = activeCallSessions.filter(
    (c) => !(c.callerId === callerId && c.receiverId === receiverId) && !(c.callerId === receiverId && c.receiverId === callerId)
  );

  const newCall = {
    id: 'call_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    callerId,
    receiverId,
    callerName: callerName || 'User',
    callerAvatar: callerAvatar || '',
    receiverName: receiverName || 'User',
    receiverAvatar: receiverAvatar || '',
    callType: callType || 'VOICE',
    status: 'RINGING',
    timestamp: Date.now(),
  };

  activeCallSessions.push(newCall);
  return res.json({ success: true, call: newCall });
});

app.post('/api/calls/respond', (req, res) => {
  const { callId, action } = req.body; // action: 'ACCEPT' | 'REJECT' | 'END'
  const session = activeCallSessions.find((c) => c.id === callId);
  if (session) {
    if (action === 'ACCEPT') {
      session.status = 'ACCEPTED';
    } else if (action === 'REJECT') {
      session.status = 'REJECTED';
    } else if (action === 'END') {
      session.status = 'ENDED';
    }
    return res.json({ success: true, call: session });
  }
  return res.status(404).json({ error: 'Call session not found' });
});

app.get('/api/calls/:id', (req, res) => {
  const { id } = req.params;
  const session = activeCallSessions.find((c) => c.id === id);
  if (session) return res.json(session);
  return res.status(404).json({ error: 'Call not found' });
});

// Media Upload Route
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const isVideo = req.file.mimetype.startsWith('video');
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({
    url: fileUrl,
    mediaType: isVideo ? 'VIDEO' : 'IMAGE',
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// Serve uploaded files and public folder statically
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.sendFile(path.join(process.cwd(), 'public', 'manifest.json'));
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NT MASSAGE server running at http://localhost:${PORT}`);
  });
}

startServer();
