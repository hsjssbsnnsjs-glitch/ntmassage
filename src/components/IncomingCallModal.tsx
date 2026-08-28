import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';
import { User, CallType } from '../types';
import { UserAvatar } from './UserAvatar';
import { soundEngine } from '../lib/audioTone';

interface IncomingCallModalProps {
  caller: User;
  callType: CallType;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  caller,
  callType,
  onAccept,
  onDecline,
}) => {
  useEffect(() => {
    soundEngine.startIncomingRingTone();
    return () => {
      soundEngine.stopRingtone();
    };
  }, []);

  const handleAccept = () => {
    soundEngine.stopRingtone();
    onAccept();
  };

  const handleDecline = () => {
    soundEngine.stopRingtone();
    onDecline();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-950 border-2 border-zinc-700/90 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Pulsing Background Rings */}
        <div className="absolute top-16 w-32 h-32 rounded-full border border-white/20 animate-ping pointer-events-none" />
        <div className="absolute top-12 w-40 h-40 rounded-full border border-white/10 animate-pulse pointer-events-none" />

        {/* Caller Avatar */}
        <div className="relative z-10 p-1.5 rounded-full border-2 border-white/30 bg-zinc-900 shadow-2xl mb-4">
          <UserAvatar
            avatarUrl={caller.avatarUrl}
            displayName={caller.displayName}
            size={88}
          />
        </div>

        {/* Title & Call Type Badge */}
        <h3 className="relative z-10 text-xl font-black text-white">{caller.displayName}</h3>
        <p className="text-xs text-zinc-400 font-mono mt-0.5">@{caller.username}</p>

        <div className="relative z-10 mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-bold text-emerald-400 shadow-sm animate-pulse">
          {callType === 'VIDEO' ? <Video size={14} /> : <Mic size={14} />}
          <span>{callType === 'VIDEO' ? 'مكالمة فيديو واردة...' : 'مكالمة صوتية واردة...'}</span>
        </div>

        <p className="text-[11px] text-zinc-400 mt-2">يرغب في بدء مكالمة معك</p>

        {/* Action Buttons: Accept (Green) and Decline (Red) */}
        <div className="relative z-10 flex items-center justify-center gap-8 mt-8 w-full">
          {/* Decline */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleDecline}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all active:scale-90 cursor-pointer"
              title="رفض"
            >
              <PhoneOff size={24} />
            </button>
            <span className="text-xs text-zinc-400 font-bold">رفض</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleAccept}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all active:scale-90 animate-bounce cursor-pointer"
              title="قبول"
            >
              {callType === 'VIDEO' ? <Video size={28} /> : <Phone size={28} />}
            </button>
            <span className="text-xs text-emerald-400 font-bold">رد وتواصل</span>
          </div>
        </div>
      </div>
    </div>
  );
};
