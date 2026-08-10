export type PreprocessResult = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
};

export async function preprocessImage(
  source: HTMLCanvasElement | HTMLImageElement
): Promise<PreprocessResult> {
  const origWidth = source.width;
  const origHeight = source.height;

  const maxEdge = 1600;
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (origWidth > maxEdge || origHeight > maxEdge) {
    if (origWidth > origHeight) {
      targetWidth = maxEdge;
      targetHeight = Math.round((origHeight * maxEdge) / origWidth);
    } else {
      targetHeight = maxEdge;
      targetWidth = Math.round((origWidth * maxEdge) / origHeight);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

    // Apply simple contrast stretch / grayscale in-place if image data available
    try {
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Luminance grayscale
        const avg = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      }

      ctx.putImageData(imageData, 0, 0);
    } catch {
      // Ignore cross-origin / mock canvas errors in jsdom
    }
  }

  return {
    canvas,
    width: targetWidth,
    height: targetHeight,
  };
}
