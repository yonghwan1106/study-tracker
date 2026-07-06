const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_OUTPUT_CHARS = 900_000;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 읽지 못했습니다.'));
    };
    image.src = url;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('이미지를 변환하지 못했습니다.'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'));
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

export async function compressTextbookCover(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('표지는 이미지 파일만 올릴 수 있습니다.');
  }

  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('사진이 너무 큽니다. 8MB 이하의 이미지를 사용해주세요.');
  }

  const image = await loadImageFromFile(file);
  const attempts = [
    { maxWidth: 520, maxHeight: 740, quality: 0.78 },
    { maxWidth: 440, maxHeight: 640, quality: 0.7 },
    { maxWidth: 360, maxHeight: 520, quality: 0.62 },
  ];

  for (const attempt of attempts) {
    const scale = Math.min(
      attempt.maxWidth / image.naturalWidth,
      attempt.maxHeight / image.naturalHeight,
      1
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('이미지 처리를 시작하지 못했습니다.');
    }

    canvas.width = width;
    canvas.height = height;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const dataUrl = await canvasToDataUrl(canvas, attempt.quality);
    if (dataUrl.length <= MAX_OUTPUT_CHARS) {
      return dataUrl;
    }
  }

  throw new Error('표지 이미지가 너무 큽니다. 조금 더 작은 사진을 사용해주세요.');
}
