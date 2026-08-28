import React, { useState, useRef } from 'react';
import { ArrowRight, Image as ImageIcon, Video, Crop, Sparkles, X, Check, Camera } from 'lucide-react';
import { storage } from '../lib/storage';
import { User, MediaType } from '../types';
import { uploadMediaFile } from '../lib/mediaUtils';
import { ImageCropperDialog } from '../components/ImageCropperDialog';
import { VideoPostPlayer } from '../components/VideoPostPlayer';
import { getT } from '../lib/translations';

interface CreatePostScreenProps {
  currentUser: User;
  onBack: () => void;
  onPostCreated: () => void;
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  currentUser,
  onBack,
  onPostCreated,
}) => {
  const t = getT(storage.getLanguage());
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('IMAGE');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const res = await uploadMediaFile(file);
      setMediaUrl(res.url);
      setMediaType(res.mediaType);
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل رفع الملف');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && !mediaUrl) {
      setErrorMessage('يرجى كتابة نص أو إرفاق صورة/فيديو');
      return;
    }

    storage.createPost({
      userId: currentUser.id,
      username: currentUser.username,
      userAvatarUrl: currentUser.avatarUrl,
      mediaUrl: mediaUrl || '',
      mediaType: mediaUrl ? mediaType : 'TEXT',
      caption: caption.trim(),
    });

    onPostCreated();
  };

  return (
    <div id="create-post-screen" className="min-h-screen bg-black text-white flex flex-col select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
          >
            <ArrowRight size={20} />
          </button>
          <h2 className="font-bold text-base">{t.newPost}</h2>
        </div>
        <button
          id="publish-post-btn"
          onClick={handlePublish}
          disabled={isUploading || (!caption.trim() && !mediaUrl)}
          className="px-4 py-1.5 bg-white text-black hover:bg-zinc-200 disabled:opacity-40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
        >
          <Check size={16} />
          <span>{t.publish}</span>
        </button>
      </header>

      {/* Main Form */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Caption Textarea */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
          <textarea
            id="post-caption-input"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t.writeCaption}
            rows={4}
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Media Preview Box or Selector */}
        {mediaUrl ? (
          <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
            {mediaType === 'VIDEO' ? (
              <VideoPostPlayer videoUrl={mediaUrl} className="w-full max-h-96" />
            ) : (
              <img
                src={mediaUrl}
                alt="Selected post media"
                referrerPolicy="no-referrer"
                className="w-full max-h-96 object-cover"
              />
            )}

            {/* Quality badge */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" />
              <span>4K Ultra HD</span>
            </div>

            {/* Actions Bar on Image */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              {mediaType === 'IMAGE' && (
                <button
                  type="button"
                  onClick={() => setShowCropper(true)}
                  className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 border border-white/20 cursor-pointer"
                >
                  <Crop size={14} />
                  <span>{t.cropAndRotate}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setMediaUrl(null)}
                className="w-8 h-8 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center shadow-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-800 hover:border-zinc-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors space-y-3 bg-zinc-950/40"
          >
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Camera size={26} />
            </div>
            <div>
              <p className="font-bold text-sm text-white">{t.selectPhotoOrVideo}</p>
              <p className="text-xs text-zinc-500 mt-1">يدعم 4K UHD للصور والفيديو بدون فقدان للجودة</p>
            </div>
            {isUploading && (
              <div className="text-xs text-amber-400 font-bold animate-pulse">
                جاري معالجة ورفع الملف بأعلى دقة...
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelected}
        />
      </main>

      {/* Cropper Modal */}
      {showCropper && mediaUrl && mediaType === 'IMAGE' && (
        <ImageCropperDialog
          imageSrc={mediaUrl}
          onDismiss={() => setShowCropper(false)}
          onConfirm={(croppedUrl) => {
            setMediaUrl(croppedUrl);
            setShowCropper(false);
          }}
        />
      )}
    </div>
  );
};
