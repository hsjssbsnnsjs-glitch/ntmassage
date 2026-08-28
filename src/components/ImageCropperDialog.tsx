import React, { useState, useRef, useEffect } from 'react';
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
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({ width: 600, height: 600 });

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setNaturalDimensions({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setAspect('ORIGINAL');
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

      const isRotated90or270 = rotation % 180 !== 0;
      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      // Effective source width & height after rotation
      const effectiveW = isRotated90or270 ? naturalH : naturalW;
      const effectiveH = isRotated90or270 ? naturalW : naturalH;

      let targetW = 800;
      let targetH = 800;

      if (aspect === '1:1') {
        targetW = 800;
        targetH = 800;
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
        // ORIGINAL aspect ratio: maintain exact aspect ratio without distortion
        const ratio = effectiveW / effectiveH;
        if (ratio >= 1) {
          targetW = Math.min(1200, effectiveW);
          targetH = Math.round(targetW / ratio);
        } else {
          targetH = Math.min(1200, effectiveH);
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

      // Calculate exact scaling to cover without distortion
      const baseScale = Math.max(targetW / effectiveW, targetH / effectiveH);
      const drawW = naturalW * baseScale;
      const drawH = naturalH * baseScale;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onConfirm(optimizedDataUrl);
    } catch {
      onConfirm(imageSrc);
    } finally {
      setIsProcessing(false);
    }
  };

  const getAspectStyle = () => {
    switch (aspect) {
      case '1:1':
        return { aspectRatio: '1 / 1' };
      case '3:4':
        return { aspectRatio: '3 / 4' };
      case '9:16':
        return { aspectRatio: '9 / 16' };
      case '16:9':
        return { aspectRatio: '16 / 9' };
      case 'ORIGINAL':
      default: {
        const isRotated90or270 = rotation % 180 !== 0;
        const w = isRotated90or270 ? naturalDimensions.height : naturalDimensions.width;
        const h = isRotated90or270 ? naturalDimensions.width : naturalDimensions.height;
        return { aspectRatio: `${w} / ${h}` };
      }
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
          <span className="text-[10px] text-zinc-400">تدوير وتعديل بدون أي مط أو تشويه</span>
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
      <div className="flex-1 flex items-center justify-center relative overflow-hidden my-3 bg-zinc-950 rounded-2xl border border-zinc-800/80 p-3">
        <div
          className="relative max-h-[55vh] max-w-[85vw] flex items-center justify-center overflow-hidden rounded-xl border border-zinc-700/80 shadow-2xl bg-black transition-all duration-200"
          style={{ ...getAspectStyle(), width: '100%', height: 'auto', maxHeight: '55vh', maxWidth: '85vw' }}
        >
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-100"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop candidate"
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain select-none shadow-2xl"
            />
          </div>
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
            <span>الأصلي (بدون مط)</span>
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
            <span>3:4 عمودي</span>
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
                <span>جاري الحفظ بدقة عالية...</span>
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
