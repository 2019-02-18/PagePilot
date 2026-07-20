import { create } from 'zustand'
import type { OperationPlan } from '../core/types'
import type { TaskContext, TaskPhase } from '../engine/TaskManager'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  plan?: OperationPlan
  taskPhase?: TaskPhase
}

export interface PagePilotSettings {
  capabilitySource: 'offline-demo' | 'custom-api'
  customApiUrl: string
  customApiKey: string
}

interface PagePilotState {
  open: boolean
  mode: 'operation' | 'qa'
  messages: ChatMessage[]
  taskCtx: TaskContext | null
  settings: PagePilotSettings
  settingsOpen: boolean
  pendingConfirm: OperationPlan | null

  setOpen: (open: boolean) => void
  setMode: (mode: 'operation' | 'qa') => void
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setTaskCtx: (ctx: TaskContext | null) => void
  setSettings: (s: Partial<PagePilotSettings>) => void
  setSettingsOpen: (open: boolean) => void
  setPendingConfirm: (plan: OperationPlan | null) => void
  clearMessages: () => void
}

export const usePagePilotStore = create<PagePilotState>((set) => ({
  open: false,
  mode: 'operation',
  messages: [],
  taskCtx: null,
  settings: {
    capabilitySource: 'offline-demo',
    customApiUrl: '',
    customApiKey: '',
  },
  settingsOpen: false,
  pendingConfirm: null,

  setOpen: (open) => set({ open }),
  setMode: (mode) => set({ mode }),
  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, timestamp: Date.now() },
      ],
    })),
  setTaskCtx: (ctx) => set({ taskCtx: ctx }),
  setSettings: (s) => set((state) => ({ settings: { ...state.settings, ...s } })),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setPendingConfirm: (plan) => set({ pendingConfirm: plan }),
  clearMessages: () => set({ messages: [] }),
}))
