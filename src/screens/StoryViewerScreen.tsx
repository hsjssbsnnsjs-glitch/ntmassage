import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Eye,
  Trash2,
  Heart,
  Send,
  Sparkles,
  Download,
  CheckCircle,
  MessageSquare,
  Users,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { storage } from '../lib/storage';
import { User, Story, UserStoryGroup } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { soundEngine } from '../lib/audioTone';
import { downloadMediaFile } from '../lib/mediaUtils';

interface StoryViewerScreenProps {
  currentUser: User;
  allStoryGroups: UserStoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onNavigateToChat: (userId: string) => void;
}

const QUICK_EMOJIS = ['❤️', '🔥', '😂', '👏', '😮', '😢', '😍', '🙌'];

export const StoryViewerScreen: React.FC<StoryViewerScreenProps> = ({
  currentUser,
  allStoryGroups,
  initialGroupIndex,
  onClose,
  onNavigateToChat,
}) => {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [viewersList, setViewersList] = useState<User[]>([]);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [replyToast, setReplyToast] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentGroup = allStoryGroups[groupIndex] || null;
  const currentStory: Story | null = currentGroup?.stories[storyIndex] || null;
  const isMine = currentStory ? currentStory.userId === currentUser.id : false;

  // Mark viewed for other users' stories
  useEffect(() => {
    if (currentStory && currentStory.userId !== currentUser.id) {
      storage.markStoryViewed(currentStory.id, currentUser.id);
    }
  }, [currentStory?.id, currentUser.id]);

  // Load viewers if it's my story
  useEffect(() => {
    if (currentStory && isMine) {
      const viewers = storage.getStoryViewers(currentStory.id);
      setViewersList(viewers);
    } else {
      setViewersList([]);
    }
  }, [currentStory?.id, isMine, showViewersSheet]);

  // Handle Video / Image Playback Timer (60s duration for full videos)
  useEffect(() => {
    if (isPaused || showViewersSheet || showDeleteConfirm || !currentStory) {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      return;
    }

    if (currentStory.mediaType === 'VIDEO') {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    } else {
      const duration = 10000;
      const interval = 50;
      const step = (interval / duration) * 100;

      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNextStory();
            return 0;
          }
          return prev + step;
        });
      }, interval);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [groupIndex, storyIndex, isPaused, showViewersSheet, showDeleteConfirm, currentStory?.id]);

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || isPaused || showViewersSheet) return;
    const video = videoRef.current;
    const effectiveDuration = Math.min(60, video.duration || 60);
    const current = video.currentTime;
    const calcProgress = (current / effectiveDuration) * 100;

    setProgress(Math.min(100, calcProgress));

    if (current >= effectiveDuration) {
      handleNextStory();
    }
  };

  const handleVideoEnded = () => {
    handleNextStory();
  };

  const handleNextStory = () => {
    if (!currentGroup) return;
    setProgress(0);
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else if (groupIndex < allStoryGroups.length - 1) {
      setGroupIndex((prev) => prev + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrevStory = () => {
    if (!currentGroup) return;
    setProgress(0);
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((prev) => prev - 1);
      const prevGroup = allStoryGroups[groupIndex - 1];
      setStoryIndex(prevGroup.stories.length - 1);
    }
  };

  // High Quality Download to Gallery / Studio
  const handleDownloadStoryHQ = async () => {
    if (!currentStory || !currentStory.mediaUrl) return;

    setDownloadToast('جاري حفظ القصة في الاستوديو...');
    const ext = currentStory.mediaType === 'VIDEO' ? 'mp4' : 'jpg';
    const filename = `NT_STORY_${currentStory.username}_${Date.now()}.${ext}`;

    const success = await downloadMediaFile(currentStory.mediaUrl, filename);
    if (success) {
      setDownloadToast('تم حفظ القصة في الاستوديو بجودة أصلية');
    } else {
      setDownloadToast('تم بدء التنزيل المباشر');
    }
    setTimeout(() => setDownloadToast(null), 3000);
  };

  const handleSendStoryReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !currentStory) return;

    const textToSend = replyText.trim();
    storage.sendMessage({
      senderId: currentUser.id,
      receiverId: currentStory.userId,
      text: `💬 رد على القصة: ${textToSend}`,
      mediaUrl: currentStory.mediaUrl,
      mediaType: 'TEXT',
    });

    soundEngine.playSendPop();
    setReplyText('');
    setIsPaused(false);
    setReplyToast('تم إرسال الرد في الخاص بنجاح');
    setTimeout(() => setReplyToast(null), 2500);
  };

  const handleSendQuickEmoji = (emoji: string) => {
    if (!currentStory) return;

    storage.sendMessage({
      senderId: currentUser.id,
      receiverId: currentStory.userId,
      text: `${emoji} تفاعل على قصتك`,
      mediaUrl: currentStory.mediaUrl,
      mediaType: 'TEXT',
    });

    soundEngine.playSendPop();
    setReplyToast(`أرسلت ${emoji} لصاحب القصة`);
    setTimeout(() => setReplyToast(null), 2500);
  };

  const handleDeleteCurrentStory = () => {
    if (!currentStory) return;
    storage.deleteStory(currentStory.id);
    setShowDeleteConfirm(false);
    handleNextStory();
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <div
      id="story-viewer-screen"
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none"
    >
      <div className="relative w-full max-w-md h-full sm:h-[92vh] sm:rounded-3xl bg-zinc-950 overflow-hidden flex flex-col justify-between shadow-2xl border sm:border-zinc-800">
        {/* Top Progress Bars */}
        <div className="absolute top-0 inset-x-0 z-40 p-3 flex gap-1.5 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
          {currentGroup.stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width:
                    idx < storyIndex
                      ? '100%'
                      : idx === storyIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-5 inset-x-0 z-40 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserAvatar
              avatarUrl={currentStory.userAvatarUrl}
              displayName={currentStory.username}
              size={38}
            />
            <div>
              <p className="font-bold text-xs text-white">@{currentStory.username}</p>
              <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Clock size={10} />
                <span>
                  {new Date(currentStory.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {currentStory.mediaType === 'VIDEO' && (
                  <span className="text-[9px] text-zinc-400 bg-white/10 px-1.5 py-0.2 rounded font-mono">
                    60s
                  </span>
                )}
              </p>
            </div>
            {currentStory.isCloseFriendsOnly && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                أصدقاء مقربون
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Download HQ Button */}
            {currentStory.mediaUrl && (
              <button
                id="download-story-btn"
                onClick={handleDownloadStoryHQ}
                title="تنزيل القصة بالاستوديو بأعلى جودة"
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/90 flex items-center justify-center cursor-pointer transition-transform active:scale-90 border border-white/10"
              >
                <Download size={16} />
              </button>
            )}

            {isMine && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-zinc-300 hover:text-red-400 flex items-center justify-center cursor-pointer border border-white/10"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/90 flex items-center justify-center cursor-pointer border border-white/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {downloadToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/90 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle size={14} className="text-emerald-400" />
            <span>{downloadToast}</span>
          </div>
        )}

        {replyToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/90 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in">
            <Sparkles size={14} className="text-amber-400" />
            <span>{replyToast}</span>
          </div>
        )}

        {/* Middle Screen Tap & Playback Zones */}
        <div
          className="relative flex-1 flex items-center justify-center bg-black overflow-hidden"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Left / Right Click zones */}
          <div
            onClick={handlePrevStory}
            className="absolute left-0 inset-y-0 w-1/3 z-30 cursor-pointer"
          />
          <div
            onClick={handleNextStory}
            className="absolute right-0 inset-y-0 w-1/3 z-30 cursor-pointer"
          />

          {/* Media Rendering with object-contain to prevent any distortion */}
          {currentStory.mediaUrl ? (
            currentStory.mediaType === 'VIDEO' ? (
              <video
                ref={videoRef}
                src={currentStory.mediaUrl}
                autoPlay
                playsInline
                controls={false}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={currentStory.mediaUrl}
                alt="Story"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            )
          ) : (
            <div className="p-8 text-center text-white text-xl font-bold leading-relaxed">
              {currentStory.caption}
            </div>
          )}
        </div>

        {/* Story Footer */}
        <div className="p-3 bg-gradient-to-t from-black via-black/90 to-transparent z-40 space-y-2">
          {isMine ? (
            <div className="flex items-center justify-between gap-2 py-1 px-1">
              {/* Viewers Trigger Button */}
              <button
                id="view-story-viewers-btn"
                onClick={() => {
                  setIsPaused(true);
                  setShowViewersSheet(true);
                }}
                className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 px-3.5 py-2 rounded-full text-xs font-bold text-white transition-all cursor-pointer shadow-md group"
              >
                <div className="flex items-center -space-x-1.5 rtl:space-x-reverse">
                  {viewersList.slice(0, 3).map((v) => (
                    <UserAvatar
                      key={v.id}
                      avatarUrl={v.avatarUrl}
                      displayName={v.displayName}
                      size={20}
                      className="border border-black"
                    />
                  ))}
                  {viewersList.length === 0 && <Eye size={15} className="text-zinc-400" />}
                </div>

                <span>
                  {viewersList.length === 0
                    ? 'المشاهدات (0)'
                    : `شاهدها ${viewersList.length} مستخدم`}
                </span>
                <ChevronUp size={14} className="text-zinc-400 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={handleDownloadStoryHQ}
                className="flex items-center gap-1.5 text-white bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 rounded-full border border-zinc-700/80 text-xs font-bold cursor-pointer"
              >
                <Download size={13} />
                <span>حفظ بالاستوديو</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Quick Emojis Bar */}
              <div className="flex items-center justify-between gap-1 px-1 overflow-x-auto scrollbar-none">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSendQuickEmoji(emoji)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-125 transition-all text-base flex items-center justify-center cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendStoryReply} className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => {
                    if (!replyText.trim() && !showViewersSheet) setIsPaused(false);
                  }}
                  onChange={(e) => {
                    setReplyText(e.target.value);
                    setIsPaused(true);
                  }}
                  placeholder="إرسال رد على القصة إلى الخاص..."
                  className="flex-1 bg-zinc-900/90 border border-zinc-700/80 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
                />

                <button
                  type="button"
                  onClick={() => handleSendQuickEmoji('❤️')}
                  className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 hover:scale-110 transition-transform cursor-pointer shrink-0"
                >
                  <Heart size={20} className="fill-red-500" />
                </button>

                {replyText.trim() && (
                  <button
                    type="submit"
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg cursor-pointer shrink-0 active:scale-95 transition-transform"
                  >
                    <Send size={16} />
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewers Bottom Sheet / Modal */}
      {showViewersSheet && (
        <div
          id="story-viewers-modal"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => {
            setShowViewersSheet(false);
            setIsPaused(false);
          }}
        >
          <div
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl max-h-[75vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-zinc-300" />
                <h3 className="font-bold text-sm text-white">مشاهدو القصة</h3>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[11px] font-bold text-zinc-300">
                  {viewersList.length}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowViewersSheet(false);
                  setIsPaused(false);
                }}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Viewers List */}
            <div className="flex-1 overflow-y-auto p-3 divide-y divide-zinc-900">
              {viewersList.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 space-y-2">
                  <Eye size={36} className="mx-auto text-zinc-600 opacity-60" />
                  <p className="text-xs font-bold text-zinc-400">لا توجد مشاهدات حتى الآن</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    ستظهر هنا الحسابات والأشخاص الذين يشاهدون قصتك بمجرد فتحها.
                  </p>
                </div>
              ) : (
                viewersList.map((viewer) => (
                  <div
                    key={viewer.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-zinc-900/40 px-2 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        avatarUrl={viewer.avatarUrl}
                        displayName={viewer.displayName}
                        size={44}
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-white truncate">{viewer.displayName}</p>
                        <p className="text-[11px] text-zinc-400 font-mono truncate">@{viewer.username}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowViewersSheet(false);
                        onClose();
                        onNavigateToChat(viewer.id);
                      }}
                      className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all shrink-0"
                    >
                      <MessageSquare size={13} />
                      <span>مراسلة</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-center space-y-4">
            <h4 className="font-bold text-sm text-white">حذف القصة</h4>
            <p className="text-xs text-zinc-400">هل أنت متأكد من رغبتك في حذف هذه القصة الآن؟</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-zinc-900 text-zinc-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteCurrentStory}
                className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
