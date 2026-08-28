import { storage } from './storage';

/**
 * Upload media file with adaptive quality (4K UHD vs. Low-Data Compression for weak networks)
 */
export async function uploadMediaFile(
  file: File,
  forcedQuality?: boolean
): Promise<{ url: string; mediaType: 'IMAGE' | 'VIDEO' }> {
  const isVideo = file.type.startsWith('video');
  const mediaType: 'IMAGE' | 'VIDEO' = isVideo ? 'VIDEO' : 'IMAGE';
  const isHighQuality = forcedQuality !== undefined ? forcedQuality : storage.getHighQualityMedia();

  try {
    let fileToUpload: File | Blob = file;
    if (!isVideo && !isHighQuality) {
      const compressedBlob = await compressImageFile(file, false);
      if (compressedBlob) {
        fileToUpload = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
          type: 'image/jpeg',
        });
      }
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('quality', isHighQuality ? 'high' : 'low');

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return { url: data.url, mediaType: data.mediaType || mediaType };
      }
    }
  } catch (err) {
    console.warn('Server upload failed, falling back to persistent client encoding:', err);
  }

  // Persistent fallback using Base64 DataURL (persistent across reloads and offline)
  const fallbackUrl = await fileToDataUrl(file, isHighQuality);
  return { url: fallbackUrl, mediaType };
}

/**
 * Compresses an image file with canvas according to quality level with exact aspect ratio preservation
 */
export async function compressImageFile(file: File, isHighQuality: boolean): Promise<Blob | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);

          const MAX_DIM = isHighQuality ? 2560 : 1200;
          const QUALITY = isHighQuality ? 0.95 : 0.75;

          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(blob);
            },
            'image/jpeg',
            QUALITY
          );
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Convert File to persistent DataURL with zero distortion
 */
export async function fileToDataUrl(file: File, isHighQuality?: boolean): Promise<string> {
  const hq = isHighQuality !== undefined ? isHighQuality : storage.getHighQualityMedia();
  return new Promise((resolve, reject) => {
    const isImage = file.type.startsWith('image');
    const isVideo = file.type.startsWith('video');

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawResult = e.target?.result as string;
        if (!rawResult) {
          resolve('');
          return;
        }
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(rawResult);
              return;
            }

            const MAX_DIM = hq ? 2560 : 1200;
            const QUALITY = hq ? 0.95 : 0.75;

            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;

            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const compressed = canvas.toDataURL('image/jpeg', QUALITY);
            resolve(compressed);
          } catch {
            resolve(rawResult);
          }
        };
        img.onerror = () => resolve(rawResult);
        img.src = rawResult;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else if (isVideo) {
      // For videos: read as persistent Base64 DataURL so it doesn't expire upon reload
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve((e.target?.result as string) || '');
      };
      reader.onerror = () => {
        resolve(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Downloads a media file directly to the user's device gallery/downloads
 * Handles Data URLs, Blob URLs, and relative/absolute server URLs natively.
 */
export async function downloadMediaFile(mediaUrl: string, filename: string): Promise<boolean> {
  if (!mediaUrl) return false;

  try {
    let blob: Blob;

    if (mediaUrl.startsWith('data:')) {
      const arr = mediaUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    } else {
      const res = await fetch(mediaUrl);
      blob = await res.blob();
    }

    // Try Web Share API with files if supported (triggers native Android gallery/save sheet)
    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.share &&
      typeof File !== 'undefined'
    ) {
      try {
        const file = new File([blob], filename, { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: filename,
          });
          return true;
        }
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          return true;
        }
      }
    }

    // Standard HTML5 download trigger
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 150);

    return true;
  } catch (err) {
    console.warn('Direct blob download failed, attempting window open:', err);
    try {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch {
      return false;
    }
  }
}
