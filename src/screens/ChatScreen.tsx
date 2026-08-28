import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Phone,
  Video,
  Info,
  Paperclip,
  Send,
  Mic,
  Trash2,
  Check,
  CheckCheck,
  Star,
  Edit2,
  Reply,
  Play,
  Pause,
  Volume2,
  X,
  AlertCircle,
  MoreVertical,
  Copy,
  Pin,
  BellOff,
  Sparkles,
} from 'lucide-react';
import { storage } from '../lib/storage';
import { User, Message, MediaType } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { EmojiKeyboard } from '../components/EmojiKeyboard';
import { ConfirmModal } from '../components/ConfirmModal';
import { uploadMediaFile } from '../lib/mediaUtils';
import { getT } from '../lib/translations';

interface ChatScreenProps {
  currentUser: User;
  targetUserId: string;
  onBack: () => void;
  onNavigateToProfile: (userId: string) => void;
  onStartCall: (targetUser: User, isVideo: boolean) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  currentUser,
  targetUserId,
  onBack,
  onNavigateToProfile,
  onStartCall,
}) => {
  const t = getT(storage.getLanguage());
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('IMAGE');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [selectedMessageForAction, setSelectedMessageForAction] = useState<Message | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);

  // Real voice recording via MediaRecorder
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBlocked = targetUser ? storage.isBlocked(currentUser.id, targetUser.id) : false;

  const loadChat = () => {
    const user = storage.getUserById(targetUserId);
    setTargetUser(user);
    if (user) {
      storage.markMessagesAsRead(targetUserId, currentUser.id);
      setMessages(storage.getMessagesBetween(currentUser.id, targetUserId));
    }
  };

  useEffect(() => {
    loadChat();
    const interval = setInterval(loadChat, 2000);
    return () => clearInterval(interval);
  }, [targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Voice recording timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecordingVoice) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  const handleStartRealRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('الميكروفون غير متوفر في المتصفح');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
    } catch (err) {
      console.warn('Microphone permission denied or unavailable:', err);
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
    }
  };

  const handleStopAndSendRealRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        let voiceUrl = '';
        try {
          const res = await uploadMediaFile(audioFile);
          voiceUrl = res.url;
        } catch {
          voiceUrl = URL.createObjectURL(audioBlob);
        }
        const duration = recordingSeconds || 1;
        storage.sendMessage({
          senderId: currentUser.id,
          receiverId: targetUserId,
          text: `تسجيل صوتي (${duration} ثانية)`,
          mediaUrl: voiceUrl,
          mediaType: 'VOICE',
        });
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        setIsRecordingVoice(false);
        loadChat();
      };
      mediaRecorderRef.current.stop();
    } else {
      const duration = recordingSeconds || 2;
      storage.sendMessage({
        senderId: currentUser.id,
        receiverId: targetUserId,
        text: `تسجيل صوتي (${duration} ثانية)`,
        mediaUrl: '',
        mediaType: 'VOICE',
      });
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      setIsRecordingVoice(false);
      loadChat();
    }
  };

  const handleCancelVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setIsRecordingVoice(false);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedMediaUrl) return;

    if (editingMessage) {
      storage.editMessage(editingMessage.id, inputText.trim());
      setEditingMessage(null);
      setInputText('');
      loadChat();
      return;
    }

    const replySnippet = replyingTo
      ? replyingTo.text || (replyingTo.mediaType === 'IMAGE' ? 'صورة' : 'فيديو')
      : null;

    const replySender = replyingTo
      ? replyingTo.senderId === currentUser.id
        ? 'أنت'
        : targetUser?.displayName || 'مستخدم'
      : null;

    storage.sendMessage({
      senderId: currentUser.id,
      receiverId: targetUserId,
      text: inputText.trim(),
      mediaUrl: selectedMediaUrl,
      mediaType: selectedMediaUrl ? selectedMediaType : 'TEXT',
      replyToMessageId: replyingTo?.id,
      replyToText: replySnippet,
      replyToSenderName: replySender,
    });

    setInputText('');
    setSelectedMediaUrl(null);
    setReplyingTo(null);
    setShowEmoji(false);
    loadChat();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingMedia(true);
      try {
        const res = await uploadMediaFile(file);
        setSelectedMediaUrl(res.url);
        setSelectedMediaType(res.mediaType);
      } catch {
        const url = URL.createObjectURL(file);
        setSelectedMediaUrl(url);
        setSelectedMediaType(file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
      } finally {
        setIsUploadingMedia(false);
      }
    }
  };

  const handleTouchStartMessage = (message: Message) => {
    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessageForAction(message);
    }, 500);
  };

  const handleTouchEndMessage = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleMouseDownMessage = (message: Message) => {
    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessageForAction(message);
    }, 500);
  };

  const handleMouseUpMessage = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const togglePlayAudio = (msgId: string, mediaUrl?: string | null) => {
    if (playingAudioId === msgId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(msgId);
      if (mediaUrl) {
        try {
          const audio = new Audio(mediaUrl);
          audio.play().catch(() => {});
          audio.onended = () => setPlayingAudioId(null);
        } catch {
          setTimeout(() => setPlayingAudioId(null), 4000);
        }
      } else {
        setTimeout(() => setPlayingAudioId(null), 4000);
      }
    }
  };

  return (
    <div id="chat-screen" className="min-h-screen bg-black text-white flex flex-col select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-800 px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <button
            id="chat-back-btn"
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white shrink-0 cursor-pointer"
          >
            <ArrowRight size={20} />
          </button>

          {targetUser && (
            <div
              onClick={() => onNavigateToProfile(targetUser.id)}
              className="flex items-center gap-2.5 cursor-pointer min-w-0"
            >
              <UserAvatar
                avatarUrl={targetUser.avatarUrl}
                displayName={targetUser.displayName}
                size={38}
                isOnline={targetUser.isOnline}
                showOnlineBadge={true}
              />
              <div className="min-w-0">
                <p className="font-bold text-sm text-white truncate leading-tight">
                  {targetUser.displayName}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  {targetUser.isOnline ? (
                    <span className="text-emerald-400 font-semibold">متصل الآن</span>
                  ) : (
                    'غير متصل'
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {targetUser && (
            <>
              <button
                id="voice-call-btn"
                onClick={() => {
                  if (isBlocked) {
                    alert('لا يمكن بدء مكالمة مع مستخدم محظور');
                    return;
                  }
                  onStartCall(targetUser, false);
                }}
                title="مكالمة صوتية"
                disabled={isBlocked}
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                <Phone size={18} />
              </button>
              <button
                id="video-call-btn"
                onClick={() => {
                  if (isBlocked) {
                    alert('لا يمكن بدء مكالمة مع مستخدم محظور');
                    return;
                  }
                  onStartCall(targetUser, true);
                }}
                title="مكالمة فيديو 1080p 60FPS"
                disabled={isBlocked}
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                <Video size={19} />
              </button>
              <button
                id="user-info-btn"
                onClick={() => onNavigateToProfile(targetUser.id)}
                title="الملف الشخصي"
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <Info size={18} />
              </button>
              <button
                id="chat-header-more-btn"
                onClick={() => setShowHeaderMenu(true)}
                title={t.chatOptions}
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <MoreVertical size={18} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-2xl w-full mx-auto scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-3">
            <UserAvatar
              avatarUrl={targetUser?.avatarUrl}
              displayName={targetUser?.displayName || 'User'}
              size={64}
            />
            <p className="font-bold text-white text-base">{targetUser?.displayName}</p>
            <p className="text-xs text-zinc-400">@{targetUser?.username}</p>
            <p className="text-xs text-zinc-500 max-w-xs">
              ابدأ المحادثة الآن، الرسائل مشفرة ومحفوظة فورياً
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === currentUser.id;
            const timeString = new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={message.id}
                id={`message-bubble-${message.id}`}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <div
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSelectedMessageForAction(message);
                  }}
                  onTouchStart={() => handleTouchStartMessage(message)}
                  onTouchEnd={handleTouchEndMessage}
                  onTouchCancel={handleTouchEndMessage}
                  onMouseDown={() => handleMouseDownMessage(message)}
                  onMouseUp={handleMouseUpMessage}
                  onMouseLeave={handleMouseUpMessage}
                  className={`max-w-[82%] sm:max-w-[70%] rounded-2xl p-3 relative cursor-pointer group transition-all select-none ${
                    isMine
                      ? 'bg-white text-black rounded-bl-sm shadow-md'
                      : 'bg-zinc-900 text-white rounded-br-sm border border-zinc-800'
                  } ${message.isStarred ? 'ring-1 ring-amber-400' : ''}`}
                >
                  {/* Reply Quote preview */}
                  {message.replyToText && (
                    <div
                      className={`mb-2 p-2 rounded-lg text-xs border-r-2 ${
                        isMine
                          ? 'bg-black/10 border-black text-black/80'
                          : 'bg-white/10 border-white text-white/80'
                      }`}
                    >
                      <strong className="block text-[10px] font-black">{message.replyToSenderName}</strong>
                      <p className="truncate">{message.replyToText}</p>
                    </div>
                  )}

                  {/* Media Content */}
                  {message.mediaUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-black/10">
                      {message.mediaType === 'VIDEO' ? (
                        <video src={message.mediaUrl} controls className="max-h-60 rounded-xl w-full" />
                      ) : (
                        <img
                          src={message.mediaUrl}
                          alt="Media attachment"
                          referrerPolicy="no-referrer"
                          className="max-h-60 rounded-xl object-cover w-full"
                        />
                      )}
                    </div>
                  )}

                  {/* Voice Note Player */}
                  {message.mediaType === 'VOICE' && (
                    <div className="flex items-center gap-3 py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayAudio(message.id, message.mediaUrl);
                        }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${
                          isMine ? 'bg-black text-white' : 'bg-white text-black'
                        }`}
                      >
                        {playingAudioId === message.id ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <div>
                        <p className="font-bold text-xs">رسالة صوتية</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className={`h-1.5 w-20 rounded-full ${isMine ? 'bg-black/20' : 'bg-white/20'}`}>
                            <div
                              className={`h-full rounded-full transition-all ${
                                playingAudioId === message.id ? 'w-full bg-emerald-500' : 'w-2 bg-zinc-400'
                              }`}
                            />
                          </div>
                          <Volume2 size={12} className="opacity-60" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Text */}
                  {message.text && message.mediaType !== 'VOICE' && (
                    <div>
                      {message.text.includes('رد على القصة:') && (
                        <div
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md mb-1 w-fit ${
                            isMine ? 'bg-black/15 text-black' : 'bg-white/15 text-white'
                          }`}
                        >
                          <Sparkles size={11} className="text-amber-400" />
                          <span>رد على قصة</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                  )}

                  {/* Bubble Footer & 3-dots */}
                  <div
                    className={`flex items-center justify-between gap-2 mt-1 text-[10px] ${
                      isMine ? 'text-black/60' : 'text-zinc-500'
                    }`}
                  >
                    {/* 3-dots action menu button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMessageForAction(message);
                      }}
                      className={`p-1 rounded-full transition-opacity opacity-80 hover:opacity-100 cursor-pointer ${
                        isMine
                          ? 'hover:bg-black/10 text-black/70'
                          : 'hover:bg-white/10 text-zinc-400'
                      }`}
                      title={t.messageOptions}
                    >
                      <MoreVertical size={13} />
                    </button>

                    <div className="flex items-center gap-1">
                      {message.isStarred && <Star size={11} className="text-amber-500 fill-amber-500" />}
                      {message.isEdited && <span>(معدلة)</span>}
                      <span>{timeString}</span>
                      {isMine && (
                        <span className="mr-0.5">
                          {message.isRead ? (
                            <CheckCheck size={13} className="text-emerald-600 inline" />
                          ) : (
                            <Check size={13} className="inline" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Media Attachment Preview if chosen */}
      {selectedMediaUrl && (
        <div className="bg-zinc-900 border-t border-zinc-800 p-3 flex items-center justify-between max-w-2xl w-full mx-auto">
          <div className="flex items-center gap-3">
            <img
              src={selectedMediaUrl}
              alt="Chosen media"
              className="w-12 h-12 rounded-xl object-cover border border-zinc-700"
            />
            <span className="text-xs font-bold text-white">ملف وسائط جاهز للإرسال (4K HD)</span>
          </div>
          <button
            onClick={() => setSelectedMediaUrl(null)}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Reply Preview Banner */}
      {replyingTo && (
        <div className="bg-zinc-900/90 border-t border-zinc-800 p-2.5 flex items-center justify-between max-w-2xl w-full mx-auto text-xs">
          <div className="flex items-center gap-2 truncate">
            <Reply size={14} className="text-white shrink-0" />
            <span className="text-zinc-300 truncate">
              الرد على: <strong className="text-white">{replyingTo.text?.slice(0, 35) || 'وسائط'}</strong>
            </span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="text-zinc-400 hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Edit Message Banner */}
      {editingMessage && (
        <div className="bg-zinc-900 border-t border-zinc-800 p-2.5 flex items-center justify-between max-w-2xl w-full mx-auto text-xs">
          <div className="flex items-center gap-2 truncate">
            <Edit2 size={14} className="text-white shrink-0" />
            <span className="text-zinc-300 truncate">
              تعديل الرسالة: <strong className="text-white">{editingMessage.text}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              setEditingMessage(null);
              setInputText('');
            }}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Voice Recording Active Banner */}
      {isRecordingVoice && (
        <div className="bg-red-500/10 border-t border-red-500/30 p-3 flex items-center justify-between max-w-2xl w-full mx-auto text-sm animate-pulse">
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span>جاري التسجيل... ({recordingSeconds}s)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelVoiceRecording}
              className="p-2 rounded-xl hover:bg-red-500/20 text-red-400 cursor-pointer"
              title="إلغاء التسجيل"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={handleStopAndSendRealRecording}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-lg cursor-pointer"
            >
              <Check size={14} />
              <span>إرسال الصوت</span>
            </button>
          </div>
        </div>
      )}

      {/* Input Bar or Blocked User Alert */}
      {isBlocked ? (
        <div className="bg-zinc-950 border-t border-zinc-800 p-4 max-w-2xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-400 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <span>تم حظر هذا الحساب. لا يمكنك إرسال الرسائل إلا بعد فك الحظر.</span>
          </div>
          {targetUser && (
            <button
              onClick={() => {
                storage.toggleBlockUser(currentUser.id, targetUser.id);
                loadChat();
              }}
              className="px-4 py-1.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors cursor-pointer shadow-sm shrink-0"
            >
              إلغاء الحظر الآن
            </button>
          )}
        </div>
      ) : (
        <footer className="bg-black/95 border-t border-zinc-800 p-2.5 max-w-2xl w-full mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-center gap-1.5">
            <button
              id="emoji-toggle-btn"
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className="w-10 h-10 rounded-full hover:bg-zinc-900 flex items-center justify-center text-xl transition-colors cursor-pointer"
            >
              😊
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <button
              id="attach-media-btn"
              type="button"
              disabled={isUploadingMedia}
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-full hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              title="إرفاق ملف"
            >
              <Paperclip size={19} />
            </button>

            <input
              id="chat-input-field"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isUploadingMedia ? 'جاري رفع الملف...' : 'اكتب رسالة مشفرة...'}
              disabled={isUploadingMedia}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />

            {inputText.trim() || selectedMediaUrl ? (
              <button
                id="send-message-btn"
                type="submit"
                disabled={isUploadingMedia}
                className="w-10 h-10 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Send size={18} />
              </button>
            ) : (
              <button
                id="voice-record-btn"
                type="button"
                onClick={handleStartRealRecording}
                className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="تسجيل صوتي"
              >
                <Mic size={19} />
              </button>
            )}
          </form>

          {/* Emoji Keyboard */}
          <EmojiKeyboard
            visible={showEmoji}
            onEmojiSelected={(emoji) => setInputText((prev) => prev + emoji)}
          />
        </footer>
      )}

      {/* Message Options Modal */}
      {selectedMessageForAction && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedMessageForAction(null)}
        >
          <div
            className="w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-2 text-white animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-bold text-sm text-center border-b border-zinc-800 pb-2">
              {t.messageOptions}
            </h4>

            {/* Copy text if present */}
            {selectedMessageForAction.text && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedMessageForAction.text);
                  setSelectedMessageForAction(null);
                }}
                className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
              >
                <Copy size={16} />
                <span>{t.copyText}</span>
              </button>
            )}

            <button
              onClick={() => {
                setReplyingTo(selectedMessageForAction);
                setSelectedMessageForAction(null);
              }}
              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
            >
              <Reply size={16} />
              <span>{t.replyToMessage}</span>
            </button>

            {selectedMessageForAction.senderId === currentUser.id &&
              selectedMessageForAction.mediaType === 'TEXT' && (
                <button
                  onClick={() => {
                    setEditingMessage(selectedMessageForAction);
                    setInputText(selectedMessageForAction.text);
                    setSelectedMessageForAction(null);
                  }}
                  className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
                >
                  <Edit2 size={16} />
                  <span>{t.editText}</span>
                </button>
              )}

            <button
              onClick={() => {
                storage.toggleStarredMessage(selectedMessageForAction.id);
                setSelectedMessageForAction(null);
                loadChat();
              }}
              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
            >
              <Star
                size={16}
                className={
                  selectedMessageForAction.isStarred
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-amber-400'
                }
              />
              <span>
                {selectedMessageForAction.isStarred ? t.unstarOption : t.starOption}
              </span>
            </button>

            <button
              onClick={() => {
                storage.deleteMessage(selectedMessageForAction.id);
                setSelectedMessageForAction(null);
                loadChat();
              }}
              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
            >
              <Trash2 size={16} />
              <span>{t.deleteMessageOption}</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Options 3-Dots Modal */}
      {showHeaderMenu && targetUser && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
          onClick={() => setShowHeaderMenu(false)}
        >
          <div
            className="w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-2xl p-3 shadow-2xl space-y-1 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 p-2 border-b border-zinc-800 pb-3">
              <UserAvatar
                avatarUrl={targetUser.avatarUrl}
                displayName={targetUser.displayName}
                size={34}
              />
              <div className="min-w-0">
                <p className="font-bold text-xs truncate">{targetUser.displayName}</p>
                <p className="text-[10px] text-zinc-500 truncate">@{targetUser.username}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowHeaderMenu(false);
                onNavigateToProfile(targetUser.id);
              }}
              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
            >
              <Info size={16} />
              <span>{t.profile}</span>
            </button>

            <button
              onClick={() => {
                storage.togglePinChat(targetUser.id);
                setShowHeaderMenu(false);
                loadChat();
              }}
              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
            >
              <Pin size={16} />
              <span>
                {storage.getPinnedUserIds().includes(targetUser.id) ? t.unpinChat : t.pinChat}
              </span>
            </button>

            <button
              onClick={() => {
                storage.toggleFavoriteChat(targetUser.id);
                setShowHeaderMenu(false);
                loadChat();
              }}
              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
            >
              <Star size={16} />
              <span>
                {storage.getFavoriteUserIds().includes(targetUser.id) ? t.unfavChat : t.favChat}
              </span>
            </button>

            <button
              onClick={() => {
                storage.toggleMuteChat(targetUser.id);
                setShowHeaderMenu(false);
                loadChat();
              }}
              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
            >
              <BellOff size={16} />
              <span>
                {storage.getMutedUserIds().includes(targetUser.id) ? t.unmuteChat : t.muteChat}
              </span>
            </button>

            <button
              onClick={() => {
                setShowHeaderMenu(false);
                setShowClearChatConfirm(true);
              }}
              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
            >
              <Trash2 size={16} />
              <span>{t.deleteChat}</span>
            </button>
          </div>
        </div>
      )}

      {/* Clear Chat Confirm Modal */}
      <ConfirmModal
        isOpen={showClearChatConfirm}
        title={t.deleteChat}
        message={t.confirmDeleteChat}
        confirmText={t.delete}
        cancelText={t.cancel}
        isDestructive={true}
        onConfirm={() => {
          if (targetUser) {
            storage.clearChatWithUser(currentUser.id, targetUser.id);
            setMessages([]);
          }
          setShowClearChatConfirm(false);
        }}
        onCancel={() => setShowClearChatConfirm(false)}
      />
    </div>
  );
};
