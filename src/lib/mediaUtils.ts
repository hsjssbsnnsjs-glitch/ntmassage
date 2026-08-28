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
    console.warn('Server upload failed, falling back to client processing:', err);
  }

  // Fallback to local DataURL with respect to quality setting
  const fallbackUrl = await fileToDataUrl(file, isHighQuality);
  return { url: fallbackUrl, mediaType };
}

/**
 * Compresses an image file with canvas according to quality level
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

          const MAX_DIM = isHighQuality ? 2560 : 800;
          const QUALITY = isHighQuality ? 0.95 : 0.60;

          let { width, height } = img;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              width = MAX_DIM;
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
 * Convert File to DataURL with compression setting
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

            const MAX_DIM = hq ? 2560 : 800;
            const QUALITY = hq ? 0.95 : 0.60;

            let { width, height } = img;
            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else {
                width = Math.round((width * MAX_DIM) / height);
                width = MAX_DIM;
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
      resolve(URL.createObjectURL(file));
    } else {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }
  });
}
