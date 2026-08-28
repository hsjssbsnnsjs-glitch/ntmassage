import React, { useState, useRef } from 'react';
import { ArrowRight, Sparkles, Send, Camera, Image, Video, RotateCw, Loader2, X } from 'lucide-react';
import { storage } from '../lib/storage';
import { User, MediaType } from '../types';
import { uploadMediaFile } from '../lib/mediaUtils';
import { getT } from '../lib/translations';

interface CreateStoryScreenProps {
  currentUser: User;
  onBack: () => void;
  onStoryCreated: () => void;
}

export const CreateStoryScreen: React.FC<CreateStoryScreenProps> = ({
  currentUser,
  onBack,
  onStoryCreated,
}) => {
  const t = getT(storage.getLanguage());
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('IMAGE');
  const [isCloseFriendsOnly, setIsCloseFriendsOnly] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);
    try {
      const res = await uploadMediaFile(file);
      setMediaUrl(res.url);
      setMediaType(res.mediaType);
    } catch {
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      setMediaType(file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublishStory = () => {
    if (!mediaUrl) {
      setErrorMessage('يرجى اختيار صورة أو فيديو لنشر القصة');
      return;
    }

    storage.addStory({
      userId: currentUser.id,
      username: currentUser.username,
      userAvatarUrl: currentUser.avatarUrl,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      caption: '', // Stories are photo/video only as requested
      isCloseFriendsOnly,
    });

    onStoryCreated();
  };

  return (
    <div id="create-story-screen" className="min-h-screen bg-black text-white flex flex-col select-none relative">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
        >
          <ArrowRight size={20} />
        </button>

        <h2 className="font-bold text-sm">نشر قصة (صورة / فيديو)</h2>

        <div className="flex items-center gap-2">
          {/* Close Friends Toggle */}
          <button
            type="button"
            onClick={() => setIsCloseFriendsOnly(!isCloseFriendsOnly)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              isCloseFriendsOnly
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            <span>الأصدقاء المقربون</span>
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative max-w-md w-full mx-auto">
        {errorMessage && (
          <div className="absolute top-4 left-4 right-4 z-40 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-400 font-semibold text-center">
            {errorMessage}
          </div>
        )}

        {mediaUrl ? (
          <div className="w-full h-full max-h-[75vh] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 relative flex items-center justify-center shadow-2xl">
            {mediaType === 'VIDEO' ? (
              <video
                src={mediaUrl}
                autoPlay
                loop
                playsInline
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={mediaUrl}
                alt="Story preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            )}

            {/* Quick remove/reset overlay button */}
            <button
              onClick={() => setMediaUrl(null)}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer border border-white/10"
              title="إزالة واختيار ملف آخر"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full min-h-[60vh] max-h-[75vh] rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-dashed border-zinc-800 hover:border-zinc-600 p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl cursor-pointer transition-colors group"
          >
            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-xl">
              {isUploading ? (
                <Loader2 size={32} className="animate-spin text-white" />
              ) : (
                <Camera size={36} />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-white">اختر صورة أو فيديو للقصة</h3>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                انقر هنا للاختيار من المعرض أو التقاط صورة أو فيديو جديد بجودة فائقة
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 text-[11px] font-bold text-zinc-500">
              <span className="flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                <Image size={13} />
                <span>صور (JPG, PNG)</span>
              </span>
              <span className="flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                <Video size={13} />
                <span>فيديو (MP4, MOV)</span>
              </span>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </main>

      {/* Bottom Action Footer */}
      <footer className="p-4 bg-black/95 border-t border-zinc-800/80 max-w-md w-full mx-auto flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white flex items-center gap-2 border border-zinc-800 transition-colors cursor-pointer"
        >
          <Camera size={18} />
          <span>{mediaUrl ? 'تغيير الملف' : 'اختيار وسائط'}</span>
        </button>

        <button
          id="publish-story-btn"
          type="button"
          onClick={handlePublishStory}
          disabled={!mediaUrl || isUploading}
          className="flex-1 py-3 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={16} />
          <span>نشر القصة (24 ساعة)</span>
        </button>
      </footer>
    </div>
  );
};
