import jsQR from 'jsqr';

/**
 * Robust multi-strategy QR code decoder for mobile phone photos and uploaded images.
 * Handles high-resolution mobile photos (12MP-48MP), screen reflections, glare, and rotation.
 */
export async function decodeQrFromImage(file: File): Promise<string | null> {
  try {
    // 1. Load image file into an HTMLImageElement
    const img = await loadImageFromFile(file);

    // 2. Strategy A: Native Browser BarcodeDetector (Supported in modern Chrome/Android)
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const BarcodeDetectorClass = (window as any).BarcodeDetector;
        const formats = await BarcodeDetectorClass.getSupportedFormats?.().catch(() => ['qr_code']);
        if (!formats || formats.includes('qr_code')) {
          const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
          const barcodes = await detector.detect(img);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            return barcodes[0].rawValue;
          }
        }
      } catch (nativeErr) {
        console.warn('Native BarcodeDetector pass failed, continuing to jsQR:', nativeErr);
      }
    }

    // 3. Strategy B: Scaled Canvas with jsQR (Optimal 1000px resolution)
    // High-resolution mobile phone photos (e.g. 4000x3000) choke decoders.
    // Downscaling to max 1000px creates sharp, memory-efficient modules for jsQR.
    const standardCanvas = renderToCanvas(img, 1000);
    const standardCtx = standardCanvas.getContext('2d', { willReadFrequently: true });
    if (standardCtx) {
      const imgData = standardCtx.getImageData(0, 0, standardCanvas.width, standardCanvas.height);
      const code = jsQR(imgData.data, standardCanvas.width, standardCanvas.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (code && code.data) {
        return code.data;
      }

      // 4. Strategy C: High-Contrast / Binarized Pass (fixes screen glare / dark shadows)
      const enhancedData = enhanceContrast(imgData);
      const enhancedCode = jsQR(enhancedData.data, standardCanvas.width, standardCanvas.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (enhancedCode && enhancedCode.data) {
        return enhancedCode.data;
      }
    }

    // 5. Strategy D: Zoomed Center Crop (In case QR code is in center of a wide photo)
    const centerCanvas = renderCenterCropToCanvas(img, 800);
    const centerCtx = centerCanvas.getContext('2d', { willReadFrequently: true });
    if (centerCtx) {
      const centerData = centerCtx.getImageData(0, 0, centerCanvas.width, centerCanvas.height);
      const centerCode = jsQR(centerData.data, centerCanvas.width, centerCanvas.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (centerCode && centerCode.data) {
        return centerCode.data;
      }
    }

    // 6. Strategy E: Fallback to html5-qrcode pure file scan without DOM rendering (showImage: false)
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      // Create a temporary hidden div if needed or pass directly
      const tempId = 'temp-qr-scanner-' + Date.now();
      let tempDiv = document.getElementById(tempId);
      if (!tempDiv) {
        tempDiv = document.createElement('div');
        tempDiv.id = tempId;
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
      }
      const fallbackScanner = new Html5Qrcode(tempId);
      const text = await fallbackScanner.scanFile(file, false);
      try {
        await fallbackScanner.clear();
        tempDiv.remove();
      } catch {}
      if (text) {
        return text;
      }
    } catch (fallbackErr) {
      console.warn('Html5Qrcode fallback scanFile failed:', fallbackErr);
    }

    return null;
  } catch (err) {
    console.error('Error during QR image decoding:', err);
    return null;
  }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function renderToCanvas(img: HTMLImageElement, maxDimension: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > height && width > maxDimension) {
    height = Math.round((height * maxDimension) / width);
    width = maxDimension;
  } else if (height > maxDimension) {
    width = Math.round((width * maxDimension) / height);
    height = maxDimension;
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, 0, 0, width, height);
  }
  return canvas;
}

function renderCenterCropToCanvas(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const srcWidth = img.naturalWidth || img.width;
    const srcHeight = img.naturalHeight || img.height;
    const cropSize = Math.round(Math.min(srcWidth, srcHeight) * 0.7);
    const startX = Math.round((srcWidth - cropSize) / 2);
    const startY = Math.round((srcHeight - cropSize) / 2);
    ctx.drawImage(img, startX, startY, cropSize, cropSize, 0, 0, size, size);
  }
  return canvas;
}

function enhanceContrast(imgData: ImageData): ImageData {
  const d = new Uint8ClampedArray(imgData.data);
  const factor = 1.6; // Contrast boost
  for (let i = 0; i < d.length; i += 4) {
    // Grayscale
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const contrasted = Math.min(255, Math.max(0, (gray - 128) * factor + 128));
    d[i] = contrasted;
    d[i + 1] = contrasted;
    d[i + 2] = contrasted;
  }
  return new ImageData(d, imgData.width, imgData.height);
}
