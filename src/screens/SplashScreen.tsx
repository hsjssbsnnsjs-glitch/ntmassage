import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1600);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      id="splash-screen"
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none overflow-hidden"
    >
      {/* Background Subtle Radial Glow */}
      <div className="absolute w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none animate-pulse" />

      {/* Monogram Box and Brand Animation */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center z-10"
      >
        {/* Glowing NT Monogram */}
        <div className="w-24 h-24 rounded-3xl bg-white text-black flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.4)] border border-zinc-200">
          <span className="font-black text-4xl tracking-tighter">NT</span>
        </div>

        <motion.h1
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-6 font-black text-2xl tracking-[0.2em] text-white"
        >
          NT MASSAGE
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-2 text-xs tracking-widest text-zinc-400 font-medium"
        >
          CHATS • STORIES • 4K MEDIA
        </motion.p>
      </motion.div>
    </div>
  );
};
