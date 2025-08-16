import { loader } from "@monaco-editor/react"

export const loadPath = "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs"

let isPreloaded = false

export const preloadMonacoEditor = async (): Promise<void> => {
  if (isPreloaded) {
    return
  }

  try {
    loader.config({
      paths: {
        vs: loadPath,
      },
    })

    await loader.init()
    isPreloaded = true
    console.log("Monaco Editor preload completed.")
  } catch (error) {
    console.error("Monaco Editor preload failed.")
    throw error
  }
}

export const isMonacoPreloaded = (): boolean => {
  return isPreloaded
}
