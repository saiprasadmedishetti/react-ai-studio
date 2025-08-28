export async function downscaleIfNeeded(
  file: File,
  { maxDim = 1920, force = false } = {}
) {
  // If file is <=10MB and not forced, just return original as DataURL
  const tooLarge = file.size > 10 * 1024 * 1024; // 10MB
  if (!tooLarge && !force) {
    const dataUrl = await fileToDataURL(file);
    return { dataUrl, width: null, height: null, wasDownscaled: false };
  }

  const imgDataUrl = (await fileToDataURL(file)) as string;
  const img = await dataURLToImage(imgDataUrl);

  const { width, height } = img;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Use JPEG to keep size smaller
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  return { dataUrl, width: targetW, height: targetH, wasDownscaled: true };
}

export function fileToDataURL(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dataURLToImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}
