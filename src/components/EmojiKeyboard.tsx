import React, { useState } from 'react';

interface EmojiKeyboardProps {
  visible: boolean;
  onEmojiSelected: (emoji: string) => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'شائع',
    emojis: [
      '❤️', '😂', '🔥', '😍', '👏', '🙌', '✨', '💯',
      '👍', '🙏', '😭', '🎉', '🥰', '😎', '🤩', '🚀',
      '💔', '🥺', '🤣', '💀', '👀', '🖤', '🤍', '⭐',
      '🌹', '⚡', '💪', '🤝', '👑', '🕊️', '☕', '💡',
    ],
  },
  {
    name: 'وجوه',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
      '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
      '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
    ],
  },
  {
    name: 'إيماءات',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
      '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
      '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
      '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
      '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
    ],
  },
  {
    name: 'قلوب ورموز',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
      '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
      '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
    ],
  },
  {
    name: 'طبيعة وحيوانات',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
      '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
      '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
      '🌸', '🌺', '🌹', '🌷', '🌻', '🌲', '🌴', '🍀',
    ],
  },
];

export const EmojiKeyboard: React.FC<EmojiKeyboardProps> = ({ visible, onEmojiSelected }) => {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  if (!visible) return null;

  return (
    <div
      id="emoji-keyboard"
      className="w-full bg-zinc-950 border-t border-zinc-800 flex flex-col h-64 select-none animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {/* Category Tabs */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-zinc-800/80 overflow-x-auto scrollbar-none">
        {EMOJI_CATEGORIES.map((category, idx) => {
          const isActive = selectedCategoryIndex === idx;
          return (
            <button
              key={category.name}
              id={`emoji-cat-${idx}`}
              onClick={() => setSelectedCategoryIndex(idx)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Emoji Grid */}
      <div className="flex-1 p-2 overflow-y-auto grid grid-cols-8 gap-1 auto-rows-max scrollbar-thin scrollbar-thumb-zinc-700">
        {EMOJI_CATEGORIES[selectedCategoryIndex].emojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            id={`emoji-btn-${i}`}
            onClick={() => onEmojiSelected(emoji)}
            className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-zinc-800/70 active:scale-90 rounded-lg transition-transform cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
