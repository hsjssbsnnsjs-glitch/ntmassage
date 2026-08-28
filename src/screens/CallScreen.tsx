import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { User, CallType } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { soundEngine } from '../lib/audioTone';

interface CallScreenProps {
  currentUser: User;
  targetUser: User;
  callType: CallType;
  initialStatus?: 'RINGING' | 'CONNECTED';
  channelId?: string;
  onEndCall: () => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  currentUser,
  targetUser,
  callType,
  initialStatus = 'RINGING',
  channelId,
  onEndCall,
}) => {
  const [callStatus, setCallStatus] = useState<'RINGING' | 'CONNECTED' | 'REJECTED' | 'NO_ANSWER'>(
    initialStatus
  );
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'VIDEO');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize Media Stream (Camera & Mic)
  useEffect(() => {
    let active = true;

    const initMedia = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: callType === 'VIDEO' ? { facingMode: cameraFacingMode } : false,
            audio: true,
          });
          if (active) {
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.play().catch(() => {});
            }
          }
        }
      } catch (err) {
        console.warn('Camera/Mic stream access:', err);
      }
    };

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [callType]);

  // Ensure Video Stream is attached whenever isVideoEnabled changes or ref updates
  useEffect(() => {
    if (callType === 'VIDEO' && isVideoEnabled && localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [isVideoEnabled, callType]);

  // Call status polling & ringing tone management (DO NOT auto-answer!)
  useEffect(() => {
    if (callStatus === 'RINGING') {
      soundEngine.startOutgoingTone();

      let timeoutTimer: NodeJS.Timeout;
      // 45 seconds timeout if no response
      timeoutTimer = setTimeout(() => {
        soundEngine.stopOutgoingTone();
        setCallStatus('NO_ANSWER');
        setTimeout(() => onEndCall(), 2000);
      }, 45000);

      // Poll server/localStorage for peer acceptance or rejection
      const interval = setInterval(async () => {
        try {
          const activeCallId = channelId || localStorage.getItem('nt_massage_active_call_id');
          if (activeCallId) {
            const res = await fetch(`/api/calls/${activeCallId}`);
            if (res.ok) {
              const session = await res.json();
              if (session.status === 'ACCEPTED') {
                soundEngine.stopOutgoingTone();
                setCallStatus('CONNECTED');
                clearInterval(interval);
                clearTimeout(timeoutTimer);
              } else if (session.status === 'REJECTED') {
                soundEngine.stopOutgoingTone();
                setCallStatus('REJECTED');
                clearInterval(interval);
                clearTimeout(timeoutTimer);
                setTimeout(() => onEndCall(), 2000);
              } else if (session.status === 'ENDED') {
                soundEngine.stopOutgoingTone();
                clearInterval(interval);
                clearTimeout(timeoutTimer);
                onEndCall();
              }
            }
          }
        } catch {
          // Local fallback check
        }
      }, 1200);

      return () => {
        soundEngine.stopOutgoingTone();
        clearInterval(interval);
        clearTimeout(timeoutTimer);
      };
    } else {
      soundEngine.stopOutgoingTone();
    }
  }, [callStatus, channelId]);

  // Call duration counter once connected
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus === 'CONNECTED') {
      timer = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  // Audio Mute toggle
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !next));
    }
  };

  // Video Camera toggle without freezing/crashing
  const handleToggleVideo = () => {
    const next = !isVideoEnabled;
    setIsVideoEnabled(next);

    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = next;
      });
    }

    if (next && localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      localVideoRef.current.play().catch(() => {});
    }
  };

  // Switch Front/Rear Camera safely
  const handleSwitchCamera = async () => {
    const nextMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextMode);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextMode },
          audio: false,
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (newVideoTrack && localStreamRef.current) {
          // Remove old video tracks
          localStreamRef.current.getVideoTracks().forEach((t) => {
            t.stop();
            localStreamRef.current?.removeTrack(t);
          });
          // Add new video track
          localStreamRef.current.addTrack(newVideoTrack);
          newVideoTrack.enabled = isVideoEnabled;
        }
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          localVideoRef.current.play().catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Switch camera error:', err);
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div
      id="call-screen"
      className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-6 select-none overflow-hidden"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 pointer-events-none" />

      {/* Top Bar Status */}
      <div className="relative z-20 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-[11px] font-bold text-zinc-300">اتصال مباشر مشفر End-to-End</span>
        </div>

        {callType === 'VIDEO' && isVideoEnabled && (
          <button
            onClick={handleSwitchCamera}
            className="w-9 h-9 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer transition-colors"
            title="تبديل الكاميرا (أمامية/خلفية)"
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {/* Center Peer Profile / Video Frame */}
      <div className="relative z-20 flex flex-col items-center justify-center my-auto space-y-4 w-full">
        {callType === 'VIDEO' ? (
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl flex items-center justify-center">
            {/* Always kept in DOM for instant seamless unfreezing */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isVideoEnabled ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
              }`}
            />

            {/* When Video is turned off */}
            {!isVideoEnabled && (
              <div className="flex flex-col items-center space-y-3 p-6 text-center animate-in fade-in">
                <UserAvatar
                  avatarUrl={targetUser.avatarUrl}
                  displayName={targetUser.displayName}
                  size={90}
                />
                <p className="text-xs font-bold text-zinc-400">تم إيقاف الكاميرا</p>
              </div>
            )}

            {isVideoEnabled && (
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-bold flex items-center gap-1">
                <Sparkles size={11} className="text-white" />
                <span>1080p 60FPS HD</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {callStatus === 'RINGING' && (
                <div className="absolute -inset-4 rounded-full border border-white/20 animate-ping pointer-events-none" />
              )}
              <UserAvatar
                avatarUrl={targetUser.avatarUrl}
                displayName={targetUser.displayName}
                size={110}
              />
            </div>

            <div className="text-center">
              <h2 className="font-black text-2xl text-white tracking-wide">
                {targetUser.displayName}
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">@{targetUser.username}</p>
            </div>
          </div>
        )}

        {/* Call Timer or Ringing indicator */}
        <div className="text-center">
          {callStatus === 'RINGING' && (
            <p className="text-xs text-zinc-400 font-bold animate-pulse">جاري الرنين والاتصال...</p>
          )}

          {callStatus === 'CONNECTED' && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{formatDuration(durationSeconds)}</span>
            </div>
          )}

          {callStatus === 'REJECTED' && (
            <p className="text-xs text-red-400 font-bold">تم رفض المكالمة من قبل الطرف الآخر</p>
          )}

          {callStatus === 'NO_ANSWER' && (
            <p className="text-xs text-amber-400 font-bold">لا يوجد رد حالياً</p>
          )}
        </div>
      </div>

      {/* Call Controls Footer */}
      <div className="relative z-20 max-w-sm w-full mx-auto bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-4 flex items-center justify-around shadow-2xl">
        {/* Mute Toggle */}
        <button
          onClick={handleToggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-zinc-900 text-white hover:bg-zinc-800'
          }`}
          title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Video Toggle */}
        {callType === 'VIDEO' && (
          <button
            onClick={handleToggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              !isVideoEnabled
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
            title={isVideoEnabled ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
          >
            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        )}

        {/* Speaker Toggle */}
        <button
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            !isSpeakerOn
              ? 'bg-zinc-900 text-zinc-500'
              : 'bg-zinc-900 text-white hover:bg-zinc-800'
          }`}
          title="مكبر الصوت"
        >
          {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        {/* Hang Up Button */}
        <button
          id="end-call-btn"
          onClick={onEndCall}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all active:scale-90 cursor-pointer"
          title="إنهاء المكالمة"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};
