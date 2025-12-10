// ANSI颜色代码映射
const ANSI_COLORS = {
  // 前景色
  30: '#000000', // 黑色
  31: '#ff0000', // 红色
  32: '#00ff00', // 绿色
  33: '#ffff00', // 黄色
  34: '#0000ff', // 蓝色
  35: '#ff00ff', // 洋红
  36: '#00ffff', // 青色
  37: '#ffffff', // 白色
  90: '#808080', // 亮黑色（灰色）
  91: '#ff8080', // 亮红色
  92: '#80ff80', // 亮绿色
  93: '#ffff80', // 亮黄色
  94: '#8080ff', // 亮蓝色
  95: '#ff80ff', // 亮洋红
  96: '#80ffff', // 亮青色
  97: '#ffffff', // 亮白色
} as const;

const ANSI_BG_COLORS = {
  // 背景色
  40: '#000000', // 黑色背景
  41: '#ff0000', // 红色背景
  42: '#00ff00', // 绿色背景
  43: '#ffff00', // 黄色背景
  44: '#0000ff', // 蓝色背景
  45: '#ff00ff', // 洋红背景
  46: '#00ffff', // 青色背景
  47: '#ffffff', // 白色背景
  100: '#808080', // 亮黑色背景
  101: '#ff8080', // 亮红色背景
  102: '#80ff80', // 亮绿色背景
  103: '#ffff80', // 亮黄色背景
  104: '#8080ff', // 亮蓝色背景
  105: '#ff80ff', // 亮洋红背景
  106: '#80ffff', // 亮青色背景
  107: '#ffffff', // 亮白色背景
} as const;

interface AnsiStyle {
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  dim?: boolean;
}

class AnsiToHtmlParser {
  private currentStyle: AnsiStyle = {};

  /**
   * 解析ANSI文本并转换为HTML
   * @param ansiText 包含ANSI转义序列的文本
   * @returns 转换后的HTML字符串
   */
  public parseAnsiToHtml(ansiText: string): string {
    // 重置样式
    this.currentStyle = {};

    // 替换换行符为<br>
    const html = ansiText.replace(/\n/g, '<br>');

    // 匹配ANSI转义序列的正则表达式
    // eslint-disable-next-line no-control-regex
    const ansiRegex = /\u001b\[([0-9;]*)m/g;

    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = ansiRegex.exec(html)) !== null) {
      // 添加匹配前的文本
      const textBefore = html.slice(lastIndex, match.index);
      if (textBefore) {
        result += this.wrapWithStyle(textBefore);
      }

      // 解析ANSI代码
      const codes = match[1] ? match[1].split(';').map(Number) : [0];
      this.processAnsiCodes(codes);

      lastIndex = ansiRegex.lastIndex;
    }

    // 添加剩余的文本
    const remainingText = html.slice(lastIndex);
    if (remainingText) {
      result += this.wrapWithStyle(remainingText);
    }

    return result;
  }

  /**
   * 处理ANSI代码并更新当前样式
   * @param codes ANSI代码数组
   */
  private processAnsiCodes(codes: number[]): void {
    for (const code of codes) {
      switch (code) {
        case 0: // 重置所有样式
          this.currentStyle = {};
          break;
        case 1: // 粗体
          this.currentStyle.bold = true;
          break;
        case 2: // 暗淡
          this.currentStyle.dim = true;
          break;
        case 3: // 斜体
          this.currentStyle.italic = true;
          break;
        case 4: // 下划线
          this.currentStyle.underline = true;
          break;
        case 22: // 取消粗体/暗淡
          this.currentStyle.bold = false;
          this.currentStyle.dim = false;
          break;
        case 23: // 取消斜体
          this.currentStyle.italic = false;
          break;
        case 24: // 取消下划线
          this.currentStyle.underline = false;
          break;
        case 39: // 默认前景色
          this.currentStyle.color = undefined;
          break;
        case 49: // 默认背景色
          this.currentStyle.backgroundColor = undefined;
          break;
        default:
          // 处理颜色代码
          if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) {
            this.currentStyle.color = ANSI_COLORS[code as keyof typeof ANSI_COLORS];
          } else if ((code >= 40 && code <= 47) || (code >= 100 && code <= 107)) {
            this.currentStyle.backgroundColor = ANSI_BG_COLORS[code as keyof typeof ANSI_BG_COLORS];
          }
          break;
      }
    }
  }

  /**
   * 用当前样式包装文本
   * @param text 要包装的文本
   * @returns 包装后的HTML
   */
  private wrapWithStyle(text: string): string {
    if (Object.keys(this.currentStyle).length === 0) {
      return text;
    }

    const styles: string[] = [];

    if (this.currentStyle.color) {
      styles.push(`color: ${this.currentStyle.color}`);
    }

    if (this.currentStyle.backgroundColor) {
      styles.push(`background-color: ${this.currentStyle.backgroundColor}`);
    }

    if (this.currentStyle.bold) {
      styles.push('font-weight: bold');
    }

    if (this.currentStyle.italic) {
      styles.push('font-style: italic');
    }

    if (this.currentStyle.underline) {
      styles.push('text-decoration: underline');
    }

    if (this.currentStyle.dim) {
      styles.push('opacity: 0.5');
    }

    const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
    return `<span${styleAttr}>${text}</span>`;
  }

  /**
   * 静态方法：快速转换ANSI文本为HTML
   * @param ansiText ANSI文本
   * @returns HTML字符串
   */
  static convert(ansiText: string): string {
    const parser = new AnsiToHtmlParser();
    return parser.parseAnsiToHtml(ansiText);
  }
}

// 导出便捷函数
export function ansiToHtml(ansiText: string): string {
  return AnsiToHtmlParser.convert(ansiText);
}
