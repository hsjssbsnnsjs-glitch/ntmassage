import React, { useState, useEffect } from 'react';
import { ArrowRight, Settings, MoreVertical, Edit3, Plus, Send, Grid, Heart, MessageSquare } from 'lucide-react';
import { storage } from '../lib/storage';
import { User, Post } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { PostGridThumbnail } from '../components/PostGridThumbnail';
import { FollowersModal } from '../components/FollowersModal';
import { FullScreenPostViewer } from '../components/FullScreenPostViewer';
import { CommentsModal } from '../components/CommentsModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { getT } from '../lib/translations';

interface ProfileScreenProps {
  currentUser: User;
  targetUserId: string;
  onBack: () => void;
  onNavigateToEditProfile: () => void;
  onNavigateToCreatePost: () => void;
  onNavigateToSettings: () => void;
  onNavigateToChat: (userId: string) => void;
  onNavigateToProfile: (userId: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  currentUser,
  targetUserId,
  onBack,
  onNavigateToEditProfile,
  onNavigateToCreatePost,
  onNavigateToSettings,
  onNavigateToChat,
  onNavigateToProfile,
}) => {
  const t = getT(storage.getLanguage());
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCloseFriend, setIsCloseFriend] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Modals & Menus
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following'>('followers');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const isMe = targetUserId === currentUser.id;

  const loadProfile = () => {
    const target = isMe ? (storage.getUserById(currentUser.id) || currentUser) : storage.getUserById(targetUserId);
    setUser(target);
    if (target) {
      setPosts(storage.getUserPosts(target.id));
      setIsFollowing(storage.isFollowing(currentUser.id, target.id));
      setIsCloseFriend(storage.isCloseFriend(currentUser.id, target.id));
      setIsBlocked(storage.isBlocked(currentUser.id, target.id));
    }
  };

  useEffect(() => {
    loadProfile();
  }, [targetUserId, currentUser.id, currentUser.avatarUrl, currentUser.displayName, currentUser.username, currentUser.bio]);

  const handleToggleFollow = () => {
    if (!user) return;
    storage.toggleFollow(currentUser.id, user.id);
    loadProfile();
  };

  const handleToggleCloseFriend = () => {
    if (!user) return;
    storage.toggleCloseFriend(currentUser.id, user.id);
    setShowOptionsMenu(false);
    loadProfile();
  };

  const handleConfirmBlock = () => {
    if (!user) return;
    storage.toggleBlockUser(currentUser.id, user.id);
    setShowOptionsMenu(false);
    setShowBlockConfirm(false);
    loadProfile();
  };

  const handleToggleLike = (post: Post) => {
    storage.togglePostLike(post.id);
    setPosts(storage.getUserPosts(targetUserId));
    if (selectedPost && selectedPost.id === post.id) {
      setSelectedPost(storage.getAllPosts().find((p) => p.id === post.id) || null);
    }
  };

  if (!user) return null;

  return (
    <div id="profile-screen" className="min-h-screen bg-black text-white flex flex-col select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="profile-back-btn"
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
          >
            <ArrowRight size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            <h2 className="font-black text-base tracking-wide">@{user.username}</h2>
            {isCloseFriend && !isMe && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                {t.closeFriend}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isMe ? (
            <button
              id="profile-settings-btn"
              onClick={onNavigateToSettings}
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
            >
              <Settings size={18} />
            </button>
          ) : (
            <div className="relative">
              <button
                id="profile-options-btn"
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
              >
                <MoreVertical size={18} />
              </button>
              {showOptionsMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl py-1 z-30 animate-in fade-in">
                  <button
                    onClick={handleToggleFollow}
                    className="w-full text-right px-4 py-2.5 text-xs font-semibold hover:bg-zinc-900 text-zinc-200 cursor-pointer"
                  >
                    {isFollowing ? t.unfollow : t.follow}
                  </button>
                  <button
                    onClick={handleToggleCloseFriend}
                    className="w-full text-right px-4 py-2.5 text-xs font-semibold hover:bg-zinc-900 text-emerald-400 cursor-pointer"
                  >
                    {isCloseFriend ? t.removeCloseFriend : t.addCloseFriend}
                  </button>
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setShowBlockConfirm(true);
                    }}
                    className="w-full text-right px-4 py-2.5 text-xs font-semibold hover:bg-red-500/10 text-red-400 cursor-pointer"
                  >
                    {isBlocked ? t.unblock : t.block}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Profile Info */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-5 pb-16">
        {/* User Card */}
        <div className="flex items-center gap-6 pt-2">
          <UserAvatar
            avatarUrl={user.avatarUrl}
            displayName={user.displayName}
            size={80}
            isOnline={user.isOnline}
            showOnlineBadge={true}
          />

          {/* Stats Bar */}
          <div className="flex-1 grid grid-cols-3 text-center">
            <div>
              <p className="font-black text-lg text-white">{posts.length}</p>
              <p className="text-xs text-zinc-400">{t.posts}</p>
            </div>
            <div
              id="profile-followers-stat"
              onClick={() => {
                setFollowersModalTab('followers');
                setShowFollowersModal(true);
              }}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <p className="font-black text-lg text-white">{user.followersCount}</p>
              <p className="text-xs text-zinc-400">{t.followers}</p>
            </div>
            <div
              id="profile-following-stat"
              onClick={() => {
                setFollowersModalTab('following');
                setShowFollowersModal(true);
              }}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <p className="font-black text-lg text-white">{user.followingCount}</p>
              <p className="text-xs text-zinc-400">{t.following}</p>
            </div>
          </div>
        </div>

        {/* Bio & Details */}
        <div className="space-y-1">
          <h1 className="font-black text-base text-white">{user.displayName}</h1>
          {user.bio && (
            <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
              {user.bio}
            </p>
          )}
          {user.emailOrPhone && (
            <p className="text-[11px] text-zinc-500">{user.emailOrPhone}</p>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {isMe ? (
            <div className="flex items-center gap-2 w-full">
              <button
                id="edit-profile-btn"
                onClick={onNavigateToEditProfile}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 size={15} />
                <span>{t.editProfile}</span>
              </button>
              <button
                id="create-post-profile-btn"
                onClick={onNavigateToCreatePost}
                className="flex-1 py-2.5 bg-white hover:bg-zinc-200 rounded-xl text-xs font-bold text-black flex items-center justify-center gap-1.5 transition-colors shadow-lg cursor-pointer"
              >
                <Plus size={16} />
                <span>{t.newPost}</span>
              </button>
            </div>
          ) : (
            <>
              <button
                id="follow-toggle-btn"
                onClick={handleToggleFollow}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                  isFollowing
                    ? 'bg-zinc-900 text-zinc-200 border border-zinc-800 hover:bg-zinc-800'
                    : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                {isFollowing ? t.unfollow : `+ ${t.follow}`}
              </button>
              <button
                id="message-user-btn"
                onClick={() => onNavigateToChat(user.id)}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Send size={15} />
                <span>{t.send}</span>
              </button>
            </>
          )}
        </div>

        {/* Posts 3x3 Grid Header */}
        <div className="border-t border-zinc-800 pt-4 flex items-center gap-2 text-sm font-bold text-white">
          <Grid size={17} />
          <span>{t.posts} ({posts.length})</span>
        </div>

        {/* 3x3 Grid Gallery */}
        {posts.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 space-y-2">
            <Grid size={40} className="stroke-1 mx-auto text-zinc-600" />
            <p className="font-bold text-white text-sm">{t.noPostsYet}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {posts.map((post) => (
              <div
                key={post.id}
                id={`grid-post-${post.id}`}
                onClick={() => setSelectedPost(post)}
                className="aspect-square bg-zinc-950 rounded-lg sm:rounded-xl overflow-hidden relative cursor-pointer group border border-zinc-800/60 hover:border-zinc-500 transition-colors"
              >
                <PostGridThumbnail post={post} />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 text-white text-xs font-bold transition-opacity z-20">
                  <span className="flex items-center gap-1 drop-shadow-md">
                    <Heart size={15} className="fill-white" />
                    {post.likesCount}
                  </span>
                  <span className="flex items-center gap-1 drop-shadow-md">
                    <MessageSquare size={15} className="fill-white" />
                    {post.commentsCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Followers / Following Modal */}
      {showFollowersModal && (
        <FollowersModal
          isOpen={true}
          targetUser={user}
          initialTab={followersModalTab}
          followersList={storage.getFollowers(user.id)}
          followingList={storage.getFollowing(user.id)}
          currentUserId={currentUser.id}
          onClose={() => setShowFollowersModal(false)}
          onSelectUser={(uid) => onNavigateToProfile(uid)}
          onToggleFollow={(uid) => {
            storage.toggleFollow(currentUser.id, uid);
            loadProfile();
          }}
          isFollowingUser={(uid) => storage.isFollowing(currentUser.id, uid)}
        />
      )}

      {/* Full Screen Post Viewer */}
      {selectedPost && (() => {
        const postIdx = posts.findIndex((p) => p.id === selectedPost.id);
        return (
          <FullScreenPostViewer
            post={selectedPost}
            currentUser={currentUser}
            onClose={() => setSelectedPost(null)}
            onLike={() => handleToggleLike(selectedPost)}
            onOpenComments={() => setActiveCommentsPostId(selectedPost.id)}
            onUserClick={(uid) => onNavigateToProfile(uid)}
            onDirectMessage={(uid) => onNavigateToChat(uid)}
            onEditCaption={(newCap) => {
              storage.updatePostCaption(selectedPost.id, newCap);
              loadProfile();
            }}
            onDeletePost={() => {
              storage.deletePost(selectedPost.id);
              setSelectedPost(null);
              loadProfile();
            }}
            hasPrevPost={postIdx > 0}
            hasNextPost={postIdx < posts.length - 1}
            onPrevPost={() => postIdx > 0 && setSelectedPost(posts[postIdx - 1])}
            onNextPost={() => postIdx < posts.length - 1 && setSelectedPost(posts[postIdx + 1])}
          />
        );
      })()}

      {/* Comments Drawer */}
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
            loadProfile();
          }}
          onDeleteComment={(cmtId) => {
            storage.deleteComment(cmtId);
            loadProfile();
          }}
        />
      )}

      {/* Block Confirmation Modal */}
      <ConfirmModal
        isOpen={showBlockConfirm}
        title={isBlocked ? t.unblock : t.block}
        message={isBlocked ? t.unblockConfirm : t.blockConfirm}
        confirmText={t.confirm}
        cancelText={t.cancel}
        isDestructive={!isBlocked}
        onConfirm={handleConfirmBlock}
        onCancel={() => setShowBlockConfirm(false)}
      />
    </div>
  );
};
