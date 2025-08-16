import { useEffect, useRef } from "react"
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css'

import styles from "./index.module.less"
import { COLORS, LANG_HUAN } from "../constants";

const PROMPT = "mysql> "
const CONTINUATION_PROMPT = "    -> "

interface MySQLShellProps {
  onCommand: (command: string) => Promise<string>;
  title?: string;
}

const MySQLShell: React.FC<MySQLShellProps> = ({ onCommand, title }) => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstance = useRef<Terminal | null>(null)
  const fitAddon = useRef<FitAddon | null>(null)

  const currentInputRef = useRef("")
  const cursorPositionRef = useRef(0)
  const multilineInputRef = useRef("")
  const isMultilineRef = useRef(false)
  const commandHistoryRef = useRef<string[]>([])
  const historyIndexRef = useRef<number>(-1)

  const getDisplayWidth = (str: string): number => {
    let width = 0
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i)
      // Full-width characters (Chinese, Japanese, Korean, etc.)
      if (
        (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
        (code >= 0x2e80 && code <= 0x2eff) || // CJK Radicals Supplement
        (code >= 0x2f00 && code <= 0x2fdf) || // Kangxi Radicals
        (code >= 0x3000 && code <= 0x303f) || // CJK Symbols and Punctuation
        (code >= 0x3040 && code <= 0x309f) || // Hiragana
        (code >= 0x30a0 && code <= 0x30ff) || // Katakana
        (code >= 0x3100 && code <= 0x312f) || // Bopomofo
        (code >= 0x3130 && code <= 0x318f) || // Hangul Compatibility Jamo
        (code >= 0x3190 && code <= 0x319f) || // Kanbun
        (code >= 0x31a0 && code <= 0x31bf) || // Bopomofo Extended
        (code >= 0x31c0 && code <= 0x31ef) || // CJK Strokes
        (code >= 0x31f0 && code <= 0x31ff) || // Katakana Phonetic Extensions
        (code >= 0x3200 && code <= 0x32ff) || // Enclosed CJK Letters and Months
        (code >= 0x3300 && code <= 0x33ff) || // CJK Compatibility
        (code >= 0x3400 && code <= 0x4dbf) || // CJK Unified Ideographs Extension A
        (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
        (code >= 0xa000 && code <= 0xa48f) || // Yi Syllables
        (code >= 0xa490 && code <= 0xa4cf) || // Yi Radicals
        (code >= 0xac00 && code <= 0xd7af) || // Hangul Syllables
        (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility Ideographs
        (code >= 0xfe10 && code <= 0xfe1f) || // Vertical Forms
        (code >= 0xfe30 && code <= 0xfe4f) || // CJK Compatibility Forms
        (code >= 0xfe50 && code <= 0xfe6f) || // Small Form Variants
        (code >= 0xff00 && code <= 0xffef) // Halfwidth and Fullwidth Forms
      ) {
        width += 2
      } else {
        width += 1
      }
    }
    return width
  }

  const getCursorDisplayPosition = (str: string, charPosition: number): number => {
    return getDisplayWidth(str.slice(0, charPosition))
  }

  useEffect(() => {
    if (!terminalRef.current) return

    const terminal = new Terminal({
      theme: {
        background: "#1a1a1a",
        foreground: "#ffffff",
        cursor: "#ffffff",
      },
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      cursorBlink: true,
      convertEol: true,
    })

    const fit = new FitAddon()
    terminal.loadAddon(fit)
    terminal.open(terminalRef.current)
    fit.fit()

    terminalInstance.current = terminal
    fitAddon.current = fit

    terminal.writeln("Welcome to MySQL Shell")
    terminal.writeln("Type your SQL commands and press Enter to execute.")
    terminal.writeln("Commands should end with semicolon (;)")
    terminal.writeln(LANG_HUAN.replace(/\n/g, '\n\r'))
    terminal.writeln("")
    terminal.write(PROMPT)

    terminal.onData((data) => {
      handleInput(data)
    })

    const handleResize = () => fit.fit()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      terminal.dispose()
    }
  }, [])

  const handleInput = (data: string) => {
    const terminal = terminalInstance.current
    if (!terminal) return

    const code = data.charCodeAt(0)

    if (data === "\r") {
      handleEnter()
    } else if (data === "\x7F") {
      handleBackspace()
    } else if (data === "\x1b[A") {
      handleArrowUp()
    } else if (data === "\x1b[B") {
      handleArrowDown()
    } else if (data === "\x1b[C") {
      handleArrowRight()
    } else if (data === "\x1b[D") {
      handleArrowLeft()
    } else if (code >= 32 && code <= 126) {
      handlePrintableChar(data)
    } else if (code > 127) {
      handlePrintableChar(data)
    }
  }

  const handlePrintableChar = (char: string) => {
    const terminal = terminalInstance.current
    if (!terminal) return

    const currentInput = currentInputRef.current
    const cursorPosition = cursorPositionRef.current

    console.log("[v0] Input debug:", { currentInput, cursorPosition, char })

    const newInput = currentInput.slice(0, cursorPosition) + char + currentInput.slice(cursorPosition)
    const newCursorPos = cursorPosition + 1

    currentInputRef.current = newInput
    cursorPositionRef.current = newCursorPos

    terminal.write("\r\x1b[K")
    terminal.write((isMultilineRef.current ? CONTINUATION_PROMPT : PROMPT) + newInput)

    const totalDisplayWidth = getDisplayWidth(newInput)
    const cursorDisplayPos = getCursorDisplayPosition(newInput, newCursorPos)
    const moveBack = totalDisplayWidth - cursorDisplayPos
    if (moveBack > 0) {
      terminal.write("\x1b[" + moveBack + "D")
    }
  }

  const handleBackspace = () => {
    const terminal = terminalInstance.current
    if (!terminal || cursorPositionRef.current === 0) return

    const currentInput = currentInputRef.current
    const cursorPosition = cursorPositionRef.current

    const newInput = currentInput.slice(0, cursorPosition - 1) + currentInput.slice(cursorPosition)
    const newCursorPos = cursorPosition - 1

    currentInputRef.current = newInput
    cursorPositionRef.current = newCursorPos

    terminal.write("\r\x1b[K")
    terminal.write((isMultilineRef.current ? CONTINUATION_PROMPT : PROMPT) + newInput)

    const totalDisplayWidth = getDisplayWidth(newInput)
    const cursorDisplayPos = getCursorDisplayPosition(newInput, newCursorPos)
    const moveBack = totalDisplayWidth - cursorDisplayPos
    if (moveBack > 0) {
      terminal.write("\x1b[" + moveBack + "D")
    }
  }

  const handleArrowLeft = () => {
    if (cursorPositionRef.current > 0) {
      const currentInput = currentInputRef.current
      const cursorPosition = cursorPositionRef.current

      const charToMove = currentInput[cursorPosition - 1]
      const moveDistance = getDisplayWidth(charToMove)

      cursorPositionRef.current = cursorPosition - 1
      terminalInstance.current?.write("\x1b[" + moveDistance + "D")
    }
  }

  const handleArrowRight = () => {
    if (cursorPositionRef.current < currentInputRef.current.length) {
      const currentInput = currentInputRef.current
      const cursorPosition = cursorPositionRef.current

      const charToMove = currentInput[cursorPosition]
      const moveDistance = getDisplayWidth(charToMove)

      cursorPositionRef.current = cursorPosition + 1
      terminalInstance.current?.write("\x1b[" + moveDistance + "C")
    }
  }

  const handleArrowUp = () => {
    if (commandHistoryRef.current.length === 0) return

    const newIndex = historyIndexRef.current === -1 ? commandHistoryRef.current.length - 1 : Math.max(0, historyIndexRef.current - 1)
    historyIndexRef.current = newIndex

    const command = commandHistoryRef.current[newIndex]
    currentInputRef.current = command
    cursorPositionRef.current = command.length

    const terminal = terminalInstance.current
    if (terminal) {
      terminal.write("\r\x1b[K")
      terminal.write(PROMPT + command)
    }
  }

  const handleArrowDown = () => {
    if (historyIndexRef.current === -1) return

    const newIndex = historyIndexRef.current + 1
    if (newIndex >= commandHistoryRef.current.length) {
      historyIndexRef.current = -1
      currentInputRef.current = ""
      cursorPositionRef.current = 0
      terminalInstance.current?.write("\r\x1b[K" + PROMPT)
    } else {
      historyIndexRef.current = newIndex
      const command = commandHistoryRef.current[newIndex]
      currentInputRef.current = command
      cursorPositionRef.current = command.length

      const terminal = terminalInstance.current
      if (terminal) {
        terminal.write("\r\x1b[K")
        terminal.write(PROMPT + command)
      }
    }
  }

  const handleEnter = async () => {
    const terminal = terminalInstance.current
    if (!terminal) return

    terminal.writeln("")

    const trimmedInput = currentInputRef.current.trim()

    if (!trimmedInput && !isMultilineRef.current) {
      terminal.write(PROMPT)
      return
    }

    if (isMultilineRef.current) {
      multilineInputRef.current += " " + trimmedInput
    } else {
      multilineInputRef.current = trimmedInput
    }

    if (!multilineInputRef.current.trim().endsWith(";")) {
      isMultilineRef.current = true
      currentInputRef.current = ""
      cursorPositionRef.current = 0
      terminal.write(CONTINUATION_PROMPT)
      return
    }

    const completeCommand = multilineInputRef.current.trim()

    commandHistoryRef.current = [...commandHistoryRef.current, completeCommand]
    historyIndexRef.current = -1

    try {
      const result = await onCommand(completeCommand)
      terminal.writeln(result)
    } catch (error) {
      terminal.writeln(`${COLORS.RED}${String(error)}${COLORS.RESET}`)
    }

    currentInputRef.current = ""
    cursorPositionRef.current = 0
    multilineInputRef.current = ""
    isMultilineRef.current = false
    terminal.write(PROMPT)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>{title}</div>
      <div ref={terminalRef} className={styles.body} />
    </div>
  );
}

export default MySQLShell
