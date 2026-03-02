const textWidthCache: Record<string, number> = {};

export const measureTextWidth = (text: string) => {
  if (!text) {
    return 0;
  }

  if (textWidthCache[text]) {
    return textWidthCache[text];
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return 0;
  }
  context.font = '600 14px Arial';

  const width = context.measureText(text).width;
  textWidthCache[text] = width;
  return width;
};
