import React, { useState, useRef } from 'react';
import { ArrowRight, Check, Camera, Link as LinkIcon, AtSign, User as UserIcon, FileText, Crop, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { storage } from '../lib/storage';
import { User } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { ImageCropperDialog } from '../components/ImageCropperDialog';
import { fileToDataUrl } from '../lib/mediaUtils';
import { getT } from '../lib/translations';

interface EditProfileScreenProps {
  currentUser: User;
  onBack: () => void;
  onProfileUpdated: (user: User) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
];

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  currentUser,
  onBack,
  onProfileUpdated,
}) => {
  const t = getT(storage.getLanguage());
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cropCandidateSrc, setCropCandidateSrc] = useState<string | null>(null);
  const [isProcessingImg, setIsProcessingImg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImg(true);
      try {
        const dataUrl = await fileToDataUrl(file, false);
        setCropCandidateSrc(dataUrl);
      } catch {
        const fallbackUrl = URL.createObjectURL(file);
        setCropCandidateSrc(fallbackUrl);
      } finally {
        setIsProcessingImg(false);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase().replace('@', '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage(
        storage.getLanguage() === 'ENGLISH'
          ? 'Username must be at least 3 characters'
          : 'اسم المستخدم يجب أن يكون 3 خانات على الأقل'
      );
      return;
    }

    const res = storage.updateUserProfile(currentUser.id, {
      displayName: displayName.trim() || cleanUsername,
      username: cleanUsername,
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
    });

    if (res.success && res.user) {
      onProfileUpdated(res.user);
      onBack();
    } else {
      setErrorMessage(res.error || t.save);
    }
  };

  return (
    <div id="edit-profile-screen" className="min-h-screen bg-black text-white flex flex-col select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
          >
            <ArrowRight size={20} />
          </button>
          <h2 className="font-bold text-base">{t.editProfile}</h2>
        </div>
        <button
          id="save-profile-btn"
          onClick={handleSave}
          className="px-4 py-1.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Check size={16} />
          <span>{t.save}</span>
        </button>
      </header>

      {/* Main Form */}
      <main className="flex-1 max-w-lg w-full mx-auto p-5 space-y-6">
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Profile Picture & Controls */}
        <div className="flex flex-col items-center gap-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative cursor-pointer group rounded-full overflow-hidden"
          >
            <UserAvatar
              avatarUrl={avatarUrl}
              displayName={displayName}
              size={96}
            />
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {isProcessingImg ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-white hover:text-zinc-200 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
            >
              {t.selectPhotoOrVideo}
            </button>
            {avatarUrl && (
              <>
                <button
                  type="button"
                  onClick={() => setCropCandidateSrc(avatarUrl)}
                  className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 cursor-pointer"
                >
                  <Crop size={12} />
                  <span>{t.cropAndRotate}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 cursor-pointer"
                  title="حذف الصورة والاعتماد على الحرف الأول"
                >
                  <Trash2 size={12} />
                  <span>إزالة</span>
                </button>
              </>
            )}
          </div>

          {/* Quick Preset Avatars */}
          <div className="w-full pt-2">
            <p className="text-[11px] font-bold text-zinc-500 mb-2 flex items-center gap-1">
              <Sparkles size={12} />
              <span>أو اختر صورة جاهزة عالية السرعة:</span>
            </p>
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
              {PRESET_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-transform cursor-pointer shrink-0 ${
                    avatarUrl === url ? 'border-white scale-110' : 'border-zinc-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Preset ${i}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
              <UserIcon size={14} />
              <span>{t.displayNamePlaceholder}</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t.displayNamePlaceholder}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
              <AtSign size={14} />
              <span>{t.usernamePlaceholder}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="username"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold font-mono">
                @
              </span>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
              <FileText size={14} />
              <span>{t.bioPlaceholder}</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t.bioPlaceholder}
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Direct Avatar Image URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
              <LinkIcon size={14} />
              <span>رابط صورة مباشر (URL)</span>
            </label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono text-left"
            />
          </div>
        </form>
      </main>

      {/* Image Cropper */}
      {cropCandidateSrc && (
        <ImageCropperDialog
          imageSrc={cropCandidateSrc}
          onDismiss={() => setCropCandidateSrc(null)}
          onConfirm={(croppedUrl) => {
            setAvatarUrl(croppedUrl);
            setCropCandidateSrc(null);
          }}
        />
      )}
    </div>
  );
};
