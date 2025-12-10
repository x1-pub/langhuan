const textWithCache: Record<string, number> = {};

export const measureTextWidth = (text: string) => {
  if (!text) {
    return 0;
  }

  if (textWithCache[text]) {
    return textWithCache[text];
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return 0;
  }
  context.font = '600 14px Arial';

  return context.measureText(text).width;
};
