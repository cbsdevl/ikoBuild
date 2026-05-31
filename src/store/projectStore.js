import { create } from 'zustand'

export const useProjectStore = create((set, get) => ({
  // Active project
  project: null,
  files: [],
  activeFile: null,
  activeTab: 'editor', // 'editor' | 'preview' | 'database' | 'deploy'

  // AI Chat
  messages: [],
  isGenerating: false,
  generationProgress: '',

  // Editor
  unsavedFiles: new Set(),

  setProject: (project) => set({ project }),
  setFiles: (files) => set({ files }),

  setActiveFile: (file) => set({ activeFile: file }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  addFile: (file) =>
    set((state) => ({
      files: [...state.files.filter((f) => f.path !== file.path), file],
    })),

  updateFileContent: (path, content) =>
    set((state) => ({
      files: state.files.map((f) => (f.path === path ? { ...f, content } : f)),
      unsavedFiles: new Set([...state.unsavedFiles, path]),
    })),

  removeFile: (path) =>
    set((state) => ({
      files: state.files.filter((f) => f.path !== path),
      activeFile:
        state.activeFile?.path === path ? state.files[0] || null : state.activeFile,
    })),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, id: Date.now() }],
    })),

  setMessages: (messages) => set({ messages }),

  setGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationProgress: (progress) => set({ generationProgress: progress }),

  markFileSaved: (path) =>
    set((state) => {
      const next = new Set(state.unsavedFiles)
      next.delete(path)
      return { unsavedFiles: next }
    }),

  clearUnsaved: () => set({ unsavedFiles: new Set() }),

  reset: () =>
    set({
      project: null,
      files: [],
      activeFile: null,
      messages: [],
      isGenerating: false,
      generationProgress: '',
      unsavedFiles: new Set(),
    }),

  // Apply AI-generated file updates
  applyFileUpdates: (updatedFiles) => {
    const { files } = get()
    const map = new Map(files.map((f) => [f.path, f]))
    updatedFiles.forEach((f) => map.set(f.path, { ...f, id: f.id || map.get(f.path)?.id }))
    set({ files: Array.from(map.values()) })
  },
}))
