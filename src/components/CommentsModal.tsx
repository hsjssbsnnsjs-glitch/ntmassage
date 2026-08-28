import React, { useState } from 'react';
import { X, Send, Trash2, Reply, MessageSquare } from 'lucide-react';
import { Comment, User } from '../types';
import { UserAvatar } from './UserAvatar';

interface CommentsModalProps {
  isOpen: boolean;
  postId: string;
  comments: Comment[];
  currentUser: User | null;
  onClose: () => void;
  onAddComment: (text: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  comments,
  currentUser,
  onClose,
  onAddComment,
  onDeleteComment,
}) => {
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(text);
    setText('');
    setReplyingTo(null);
  };

  const handleReplyClick = (comment: Comment) => {
    setReplyingTo(comment);
    if (!text.startsWith(`@${comment.username}`)) {
      setText(`@${comment.username} `);
    }
  };

  const QUICK_EMOJIS = ['❤️', '🔥', '👏', '😍', '😂', '✨', '🙌'];

  return (
    <div
      id="comments-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="comments-modal-content"
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-2xl max-h-[85vh] h-[550px] flex flex-col overflow-hidden text-white animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-white" />
            <h3 className="font-bold text-base">التعليقات ({comments.length})</h3>
          </div>
          <button
            id="close-comments-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
              <MessageSquare size={48} className="stroke-1 mb-2 text-zinc-600" />
              <p className="font-bold text-zinc-300 text-sm">لا توجد تعليقات حتى الآن</p>
              <p className="text-xs text-zinc-500 mt-1">كن أول من يترك تعليقاً لطيفاً!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isMine = comment.userId === currentUser?.id;
              const isReply = comment.text.startsWith('@');
              const timeString = new Date(comment.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={comment.id}
                  id={`comment-${comment.id}`}
                  className={`flex items-start gap-3 ${isReply ? 'pr-6' : ''}`}
                >
                  <UserAvatar
                    avatarUrl={comment.userAvatarUrl}
                    displayName={comment.username}
                    size={isReply ? 32 : 38}
                  />
                  <div className="flex-1 min-w-0 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-xs text-white">@{comment.username}</span>
                      <span className="text-[10px] text-zinc-500">{timeString}</span>
                    </div>
                    <p className="text-sm text-zinc-200 leading-relaxed break-words">{comment.text}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => handleReplyClick(comment)}
                        className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Reply size={12} />
                        <span>رد</span>
                      </button>
                      {isMine && (
                        <button
                          onClick={() => onDeleteComment(comment.id)}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>حذف</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Emojis */}
        <div className="px-4 py-2 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setText((prev) => prev + emoji)}
              className="text-xl hover:scale-125 transition-transform active:scale-95 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Replying banner */}
        {replyingTo && (
          <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-300 truncate">
              الرد على <strong className="text-white">@{replyingTo.username}</strong>: &quot;{replyingTo.text.slice(0, 30)}...&quot;
            </span>
            <button
              onClick={() => {
                setReplyingTo(null);
                setText('');
              }}
              className="text-zinc-400 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-800 flex items-center gap-2 bg-zinc-950">
          <UserAvatar
            avatarUrl={currentUser?.avatarUrl}
            displayName={currentUser?.displayName || 'Me'}
            size={36}
          />
          <input
            id="comment-input-field"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyingTo ? 'اكتب ردك...' : 'أضف تعليقاً...'}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          <button
            id="send-comment-btn"
            type="submit"
            disabled={!text.trim()}
            className="w-10 h-10 rounded-full bg-white text-black disabled:opacity-40 disabled:bg-zinc-800 disabled:text-zinc-500 flex items-center justify-center transition-all cursor-pointer"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
