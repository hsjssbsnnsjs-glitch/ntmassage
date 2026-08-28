import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, MessageSquare, Send, Download, MoreVertical, Edit2, Trash2, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Post, User } from '../types';
import { UserAvatar } from './UserAvatar';
import { VideoPostPlayer } from './VideoPostPlayer';
import { ConfirmModal } from './ConfirmModal';
import { storage } from '../lib/storage';
import { downloadMediaFile } from '../lib/mediaUtils';
import { getT } from '../lib/translations';

interface FullScreenPostViewerProps {
  post: Post;
  currentUser: User | null;
  onClose: () => void;
  onLike: () => void;
  onOpenComments: () => void;
  onUserClick: (userId: string) => void;
  onDirectMessage: (userId: string) => void;
  onEditCaption: (newCaption: string) => void;
  onDeletePost: () => void;
  onNextPost?: () => void;
  onPrevPost?: () => void;
  hasNextPost?: boolean;
  hasPrevPost?: boolean;
}

export const FullScreenPostViewer: React.FC<FullScreenPostViewerProps> = ({
  post,
  currentUser,
  onClose,
  onLike,
  onOpenComments,
  onUserClick,
  onDirectMessage,
  onEditCaption,
  onDeletePost,
  onNextPost,
  onPrevPost,
  hasNextPost,
  hasPrevPost,
}) => {
  const t = getT(storage.getLanguage());
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [captionText, setCaptionText] = useState(post.caption);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isMyPost = post.userId === currentUser?.id;

  // Sync caption when post changes
  useEffect(() => {
    setCaptionText(post.caption);
    setIsEditing(false);
  }, [post.id, post.caption]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && onPrevPost && hasPrevPost) {
        onPrevPost();
      } else if (e.key === 'ArrowLeft' && onNextPost && hasNextPost) {
        onNextPost();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNextPost, onPrevPost, hasNextPost, hasPrevPost, onClose]);

  const handleDownload = async () => {
    if (!post.mediaUrl) return;
    const ext = post.mediaType === 'VIDEO' ? 'mp4' : 'jpg';
    const filename = `NT_POST_${post.username}_${Date.now()}.${ext}`;
    const success = await downloadMediaFile(post.mediaUrl, filename);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    }
  };

  const handleSaveEdit = () => {
    onEditCaption(captionText);
    setIsEditing(false);
  };

  const handleExecuteDelete = () => {
    setShowDeleteConfirm(false);
    onDeletePost();
    onClose();
  };

  const timeFormatted = new Date(post.timestamp).toLocaleString(
    storage.getLanguage() === 'ENGLISH' ? 'en-US' : 'ar-IQ',
    {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return (
    <AnimatePresence>
      <motion.div
        id="fullscreen-post-viewer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none"
        onClick={onClose}
      >
        <motion.div
          id="fullscreen-post-viewer-card"
          initial={{ scale: 0.94, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-none sm:rounded-2xl max-h-screen sm:max-h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Navigation Arrows for Browsing Next/Previous Posts */}
          {hasPrevPost && onPrevPost && (
            <button
              onClick={onPrevPost}
              title={t.back}
              className="absolute top-1/2 -translate-y-1/2 right-2 sm:-right-12 z-40 w-10 h-10 rounded-full bg-black/70 sm:bg-zinc-900 border border-white/20 sm:border-zinc-700 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-xl cursor-pointer"
            >
              <ChevronRight size={22} />
            </button>
          )}
          {hasNextPost && onNextPost && (
            <button
              onClick={onNextPost}
              title={t.done}
              className="absolute top-1/2 -translate-y-1/2 left-2 sm:-left-12 z-40 w-10 h-10 rounded-full bg-black/70 sm:bg-zinc-900 border border-white/20 sm:border-zinc-700 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-xl cursor-pointer"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
            <div
              onClick={() => {
                onClose();
                onUserClick(post.userId);
              }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <UserAvatar
                avatarUrl={post.userAvatarUrl}
                displayName={post.username}
                size={38}
              />
              <div>
                <p className="font-bold text-sm text-white">@{post.username}</p>
                <p className="text-[11px] text-zinc-400">{timeFormatted}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Options Menu */}
              <div className="relative">
                <button
                  id="post-viewer-options-btn"
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-8 h-8 rounded-full hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                >
                  <MoreVertical size={18} />
                </button>
                {showMenu && (
                  <div className="absolute left-0 mt-2 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95">
                    {isMyPost ? (
                      <>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setIsEditing(true);
                          }}
                          className="w-full text-right px-4 py-2 text-xs font-semibold hover:bg-zinc-800 flex items-center gap-2 text-zinc-200 cursor-pointer"
                        >
                          <Edit2 size={14} />
                          <span>{t.editCaption}</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-full text-right px-4 py-2 text-xs font-semibold hover:bg-red-500/10 flex items-center gap-2 text-red-400 cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>{t.delete}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onClose();
                          onDirectMessage(post.userId);
                        }}
                        className="w-full text-right px-4 py-2 text-xs font-semibold hover:bg-zinc-800 flex items-center gap-2 text-zinc-200 cursor-pointer"
                      >
                        <Send size={14} />
                        <span>{t.sharePost}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                id="close-post-viewer-btn"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Media Container - object-contain prevents any stretching or distortion */}
          <div className="flex-1 min-h-[300px] max-h-[500px] bg-black flex items-center justify-center relative overflow-hidden">
            {post.mediaUrl ? (
              post.mediaType === 'VIDEO' ? (
                <VideoPostPlayer
                  videoUrl={post.mediaUrl}
                  className="w-full h-full max-h-[500px]"
                  onDoubleTapLike={onLike}
                />
              ) : (
                <img
                  src={post.mediaUrl}
                  alt={post.caption || 'Post image'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full max-h-[500px] object-contain"
                />
              )
            ) : (
              <div className="p-8 text-center text-lg font-medium text-white max-w-sm">
                {post.caption}
              </div>
            )}

            {downloadSuccess && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-3.5 py-1.5 rounded-full shadow-2xl z-30 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
                <CheckCircle size={14} className="text-emerald-600" />
                <span>تم حفظ الملف في الاستوديو بنجاح</span>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="px-4 py-2.5 border-t border-zinc-800/80 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-4">
              <button
                id="post-like-btn"
                onClick={onLike}
                className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <Heart
                  size={22}
                  className={post.isLiked ? 'text-red-500 fill-red-500' : 'text-zinc-300'}
                />
                <span className="font-bold text-sm">{post.likesCount}</span>
              </button>

              <button
                id="post-comments-btn"
                onClick={onOpenComments}
                className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <MessageSquare size={20} />
                <span className="font-bold text-sm">{post.commentsCount}</span>
              </button>

              <button
                id="post-share-btn"
                onClick={() => {
                  onClose();
                  onDirectMessage(post.userId);
                }}
                className="text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <Send size={19} />
              </button>
            </div>

            {post.mediaUrl && (
              <button
                id="post-download-btn"
                onClick={handleDownload}
                title={t.downloadMedia}
                className="flex items-center gap-1 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
              >
                <Download size={15} />
                <span>{t.downloadMedia}</span>
              </button>
            )}
          </div>

          {/* Caption */}
          <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-zinc-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 bg-white text-black rounded-lg text-xs font-bold hover:bg-zinc-200 cursor-pointer"
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            ) : (
              post.caption && (
                <p className="text-sm text-zinc-200 leading-relaxed break-words">
                  {post.caption}
                </p>
              )
            )}
          </div>
        </motion.div>

        {/* Delete Post Modal */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title={t.delete}
          message={t.deletePostConfirm}
          confirmText={t.delete}
          cancelText={t.cancel}
          isDestructive={true}
          onConfirm={handleExecuteDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </motion.div>
    </AnimatePresence>
  );
};
