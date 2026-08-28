import React, { useState, useRef } from 'react';
import { X, Check, RotateCw, ZoomIn, ZoomOut, RefreshCw, Smartphone, Square, Monitor, Maximize2, Loader2 } from 'lucide-react';

type AspectPreset = 'ORIGINAL' | '3:4' | '1:1' | '16:9' | '9:16';

interface ImageCropperDialogProps {
  imageSrc: string;
  onConfirm: (croppedSrc: string) => void;
  onDismiss: () => void;
}

export const ImageCropperDialog: React.FC<ImageCropperDialogProps> = ({
  imageSrc,
  onConfirm,
  onDismiss,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<AspectPreset>('ORIGINAL');
  const [isProcessing, setIsProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setAspect('ORIGINAL');
  };

  const getFrameAspectClass = () => {
    switch (aspect) {
      case '3:4':
        return 'w-64 h-[340px] aspect-[3/4]';
      case '1:1':
        return 'w-64 h-64 sm:w-72 sm:h-72 aspect-square';
      case '16:9':
        return 'w-80 h-44 sm:w-96 sm:h-56 aspect-video';
      case '9:16':
        return 'w-52 h-92 sm:w-60 sm:h-[400px] aspect-[9/16]';
      case 'ORIGINAL':
      default:
        return 'max-w-[85vw] max-h-[55vh] w-auto h-auto';
    }
  };

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for canvas'));
        img.src = imageSrc;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        onConfirm(imageSrc);
        return;
      }

      // Calculate output dimensions (max 800px to ensure ultra fast rendering and no memory lag)
      let targetW = 600;
      let targetH = 600;

      if (aspect === '1:1') {
        targetW = 600;
        targetH = 600;
      } else if (aspect === '3:4') {
        targetW = 600;
        targetH = 800;
      } else if (aspect === '9:16') {
        targetW = 540;
        targetH = 960;
      } else if (aspect === '16:9') {
        targetW = 960;
        targetH = 540;
      } else {
        const ratio = img.width / img.height;
        if (ratio > 1) {
          targetW = Math.min(800, img.width);
          targetH = Math.round(targetW / ratio);
        } else {
          targetH = Math.min(800, img.height);
          targetW = Math.round(targetH * ratio);
        }
      }

      canvas.width = targetW;
      canvas.height = targetH;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, targetW, targetH);

      ctx.save();
      ctx.translate(targetW / 2, targetH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      // Draw image centered
      const drawRatio = Math.max(targetW / img.width, targetH / img.height);
      const drawW = img.width * drawRatio;
      const drawH = img.height * drawRatio;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

      ctx.restore();

      const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onConfirm(optimizedDataUrl);
    } catch {
      onConfirm(imageSrc);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="image-cropper-dialog"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 text-white animate-in fade-in duration-200"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between py-2 border-b border-zinc-800">
        <button
          onClick={onDismiss}
          disabled={isProcessing}
          className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
        >
          <X size={20} />
        </button>
        <div className="text-center">
          <span className="font-bold text-sm block">قص وتعديل الصورة</span>
          <span className="text-[10px] text-zinc-400">تدوير، تكبير وتعديل الأبعاد بدون تعليق</span>
        </div>
        <button
          onClick={handleReset}
          disabled={isProcessing}
          className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
          title="إعادة ضبط"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Viewport Frame */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden my-3 bg-zinc-950 rounded-2xl border border-zinc-800/80">
        {aspect !== 'ORIGINAL' && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            <div
              className={`${getFrameAspectClass()} rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] transition-all duration-200`}
            />
          </div>
        )}

        <div
          className="transition-transform duration-100 flex items-center justify-center"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop candidate"
            referrerPolicy="no-referrer"
            className="max-h-[55vh] max-w-[85vw] object-contain select-none shadow-2xl"
          />
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 space-y-3 max-w-md mx-auto w-full">
        {/* Aspect Ratio Selector Chips */}
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setAspect('ORIGINAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer ${
              aspect === 'ORIGINAL'
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <Maximize2 size={13} />
            <span>الأصلي (حر)</span>
          </button>
          <button
            onClick={() => setAspect('3:4')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer ${
              aspect === '3:4'
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <Smartphone size={13} />
            <span>3:4 / منشور</span>
          </button>
          <button
            onClick={() => setAspect('1:1')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer ${
              aspect === '1:1'
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <Square size={13} />
            <span>1:1 مربع</span>
          </button>
          <button
            onClick={() => setAspect('16:9')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer ${
              aspect === '16:9'
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <Monitor size={13} />
            <span>16:9 عريض</span>
          </button>
        </div>

        {/* Zoom Slider & Rotate */}
        <div className="flex items-center gap-3 pt-1">
          <ZoomOut size={16} className="text-zinc-400" />
          <input
            type="range"
            min="0.8"
            max="3.0"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 accent-white h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <ZoomIn size={16} className="text-zinc-400" />

          <button
            onClick={handleRotate}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
            title="تدوير 90 درجة"
          >
            <RotateCw size={17} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onDismiss}
            disabled={isProcessing}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 font-semibold text-xs hover:bg-zinc-800 cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={handleApply}
            disabled={isProcessing}
            className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جاري المعالجة...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>تطبيق التعديل</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
