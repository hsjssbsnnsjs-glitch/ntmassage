import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Heart, Video } from 'lucide-react';

interface VideoPostPlayerProps {
  videoUrl: string;
  className?: string;
  onDoubleTapLike?: () => void;
  isStory?: boolean;
  onDurationLoaded?: (durationSec: number) => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTimeSec: number, durationSec: number) => void;
}

export const VideoPostPlayer: React.FC<VideoPostPlayerProps> = ({
  videoUrl,
  className = 'w-full min-h-[220px] max-h-[560px]',
  onDoubleTapLike,
  isStory = false,
  onDurationLoaded,
  onEnded,
  onTimeUpdate,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(isStory ? false : true);
  const [showHeart, setShowHeart] = useState(false);
  const [showPlayIndicator, setShowPlayIndicator] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);

  const handleVideoTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isStory) return;
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      onDoubleTapLike?.();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
    } else {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
        setShowPlayIndicator(true);
        setTimeout(() => setShowPlayIndicator(false), 700);
      }
    }
    lastTapRef.current = now;
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      id="video-post-player"
      onClick={handleVideoTap}
      className={`relative bg-black flex items-center justify-center overflow-hidden cursor-pointer select-none ${className}`}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        loop={!isStory}
        playsInline
        autoPlay
        muted={isMuted}
        className={isStory ? 'w-full h-full object-cover mx-auto' : 'w-full max-h-[600px] object-cover mx-auto'}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => {
          const dur = e.currentTarget.duration;
          if (dur && !isNaN(dur) && dur > 0) {
            onDurationLoaded?.(dur);
          }
        }}
        onTimeUpdate={(e) => {
          const current = e.currentTarget.currentTime;
          const dur = e.currentTarget.duration;
          if (dur && !isNaN(dur) && dur > 0) {
            onTimeUpdate?.(current, dur);
          }
        }}
        onEnded={() => {
          onEnded?.();
        }}
      />

      {!isStory && (
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md border border-zinc-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-bold text-white tracking-wider shadow-lg">
          <Video size={13} className="text-white" />
          <span>REELS • 4K</span>
        </div>
      )}

      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart
            size={90}
            className="text-red-500 fill-red-500 animate-in zoom-in-50 fade-in duration-300 drop-shadow-2xl"
          />
        </div>
      )}

      {showPlayIndicator && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white animate-in zoom-in-75 duration-200 shadow-2xl">
            {isPlaying ? <Play size={32} /> : <Pause size={32} />}
          </div>
        </div>
      )}

      <button
        id="video-mute-btn"
        onClick={toggleMute}
        className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition-colors z-10 shadow-lg"
      >
        {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
      </button>
    </div>
  );
};
