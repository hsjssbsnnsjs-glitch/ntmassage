import React, { useState } from 'react';
import { Play, Image as ImageIcon } from 'lucide-react';
import { Post } from '../types';

interface PostGridThumbnailProps {
  post: Post;
}

export const PostGridThumbnail: React.FC<PostGridThumbnailProps> = ({ post }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!post.mediaUrl || hasError) {
    return (
      <div className="w-full h-full p-2.5 flex flex-col items-center justify-center text-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800/80 group-hover:scale-105 transition-transform duration-200">
        {post.caption ? (
          <p className="text-[11px] sm:text-xs text-zinc-200 font-medium line-clamp-3 leading-relaxed">
            {post.caption}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-1 text-zinc-500">
            <ImageIcon size={22} className="stroke-1" />
            <span className="text-[10px]">منشور</span>
          </div>
        )}
      </div>
    );
  }

  if (post.mediaType === 'VIDEO') {
    return (
      <div className="w-full h-full relative bg-zinc-950 flex items-center justify-center overflow-hidden">
        <video
          src={`${post.mediaUrl}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          onError={() => setHasError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        {/* Video badge */}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm flex items-center gap-1 text-white text-[10px] font-bold z-10 border border-white/10 shadow-sm">
          <Play size={10} className="fill-white" />
          <span>فيديو</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-zinc-950 flex items-center justify-center overflow-hidden">
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
      )}
      <img
        src={post.mediaUrl}
        alt={post.caption || 'Post image'}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
