import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css'

import { LANG_HUAN, COLORS } from './constants'
import styles from './index.module.less'
import { ConnectionType } from '@/api/connection';

interface SqlTerminalProps {
  onCommand: (command: string) => Promise<string>;
  prompt?: string;
  title?: string;
  type: ConnectionType;
}

const TerminalBox: React.FC<SqlTerminalProps> = ({ onCommand, type, prompt = '>', title = 'Terminal v1.0' }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal>(null);

  const commandHistory = useRef<string[]>([]); // 已经执行的命令的记录
  const historyIndex = useRef<number>(-1); // 已经执行的命令的记录的索引
  const currentInput = useRef<string>(''); // 当前正在编辑的命令
  const tempInput = useRef<string>(''); // 临时保存未提交的输入
  const cursorPosition = useRef<number>(0); // 当前光标位置（相对于输入内容）

  const verifyCommand = (command: string) => {
    if (!command) {
      currentInput.current = '';
      tempInput.current = '';
      cursorPosition.current = 0;
      writelnColorText('')
      // redrawInputLine();
      throw new Error('empty')
    }

    if (type === 'mysql' && !command.endsWith(';')) {
      writelnColorText('')
      throw new Error('end with')
    }
  }

  // 处理回车
  const handleEnter = async () => {
    if (!terminal.current) {
      return
    }

    const command = currentInput.current.trim();

    verifyCommand(command)
    writelnColorText('')

    const newHistory = [...commandHistory.current, command];
    commandHistory.current = newHistory
    historyIndex.current = -1

    try {
      const result = await onCommand(command);
      writelnColorText(result)
    } catch (error) {
      writelnColorText(String(error).replace(/\n/g, '\n\r'), COLORS.RED)
    }

    currentInput.current = '';
    tempInput.current = '';
    cursorPosition.current = 0;
    redrawInputLine();
  };

  // 处理退格
  const handleBackspace = () => {
    if (cursorPosition.current > 0) {
      currentInput.current =
        currentInput.current.slice(0, cursorPosition.current - 1) +
        currentInput.current.slice(cursorPosition.current);

      cursorPosition.current--;

      redrawInputLine();
    }
  };

  // 处理上箭头
  const handleArrowUp = () => {
    if (commandHistory.current.length === 0) return;

    const newIndex = historyIndex.current < 0
      ? commandHistory.current.length - 1
      : Math.max(0, historyIndex.current - 1);

    if (newIndex !== historyIndex.current) {
      // 保存未提交的输入
      if (historyIndex.current === -1) {
        tempInput.current = currentInput.current;
      }

      historyIndex.current = newIndex
      updateCurrentLine(commandHistory.current[newIndex]);
    }
  };

  // 处理下箭头
  const handleArrowDown = () => {
    if (commandHistory.current.length === 0) return;

    const newIndex = historyIndex.current < 0
      ? -1
      : Math.min(commandHistory.current.length - 1, historyIndex.current + 1);

    if (newIndex !== historyIndex.current) {
      historyIndex.current = newIndex
      // setHistoryIndex(newIndex);
      const newContent = newIndex === -1
        ? tempInput.current
        : commandHistory.current[newIndex];
      updateCurrentLine(newContent);
    }
  };

  // 处理左箭头
  const handleArrowLeft = () => {
    if (!terminal.current) {
      return
    }

    if (cursorPosition.current > 0) {
      cursorPosition.current--;
      terminal.current.write('\x1b[D'); // 左移光标
    }
  };

  // 处理右箭头
  const handleArrowRight = () => {
    if (!terminal.current) {
      return
    }

    if (cursorPosition.current < currentInput.current.length) {
      cursorPosition.current++;
      terminal.current.write('\x1b[C'); // 右移光标
    }
  };

  // 更新当前行内容
  const updateCurrentLine = (content: string) => {
    currentInput.current = content;
    cursorPosition.current = content.length; // 光标置于末尾
    redrawInputLine();
  };

  // 处理可打印字符
  const handlePrintableChar = (char: string) => {
    // 在光标位置插入字符
    currentInput.current =
      currentInput.current.slice(0, cursorPosition.current) +
      char +
      currentInput.current.slice(cursorPosition.current);

    // 重绘输入行
    cursorPosition.current += char.length;
    redrawInputLine();
  };

  const redrawInputLine = () => {
    if (!terminal.current) {
      return
    }

    // 清除当前行
    terminal.current.write('\x1b[2K\r');

    // 写 prompt + text
    writeColorText(prompt, COLORS.GREEN)
    writeColorText(currentInput.current)

    // 定位光标
    terminal.current.write(`\x1b[${cursorPosition.current + prompt.length + 1}G`);
  };

  const writeColorText = (text: string, colorCode: string = COLORS.RESET) => {
    terminal.current?.write(`${colorCode}${text}${COLORS.RESET}`);
  }

  const writelnColorText = (text: string, colorCode: string = COLORS.RESET) => {
    terminal.current?.write(`${colorCode}${text}${COLORS.RESET}\r\n`);
  }

  const renderWelcome = () => {
    writelnColorText('警告1: 请谨慎进行删除操作', COLORS.RED)
    writelnColorText('警告2: 执行结果的渲染没有做充足的测试(但不影响命令的执行)', COLORS.RED)
    writelnColorText('警告3: 中文输入存在光标位置错位的问题(下个小版本修复)', COLORS.RED)
    writelnColorText(LANG_HUAN.replace(/\n/g, '\n\r'))
    redrawInputLine();
  }

  useEffect(() => {
    if (!terminalRef.current) {
      return
    }

    cursorPosition.current = 0;

    terminal.current = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#adadad',
      },
      cursorStyle: 'block',
    })

    const fitAddon = new FitAddon();
    terminal.current.loadAddon(fitAddon);
    terminal.current.open(terminalRef.current)
    terminal.current.focus()
    requestAnimationFrame(() => {
      fitAddon.fit();
    })

    renderWelcome()

    terminal.current.onData(async (data) => {
      switch (data) {
        case '\r':
          await handleEnter();
          break;
        case '\x7F':
          handleBackspace();
          break;
        case '\x1b[A':
          handleArrowUp();
          break;
        case '\x1b[B':
          handleArrowDown();
          break;
        case '\x1b[D':
          handleArrowLeft();
          break;
        case '\x1b[C':
          handleArrowRight();
          break;
        default:
          if (data.charCodeAt(0) === 9) {
            // Tab 自动补全
          }
          if (data >= String.fromCharCode(0x20)) {
            handlePrintableChar(data);
          }
      }
    })

    const handleResize = () => {
      fitAddon.fit();
    }
    window.addEventListener('resize', handleResize);

    return () => {
      terminal.current?.dispose()
      window.removeEventListener('resize', handleResize)
    }
  }, []);


  return (
    <div className={styles.container}>
      <div className={styles.header}>{title}</div>
      <div ref={terminalRef} className={styles.body} />
    </div>
  );
};

export default TerminalBox
