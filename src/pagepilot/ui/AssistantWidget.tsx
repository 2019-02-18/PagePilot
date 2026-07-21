import { useRef, useEffect, useCallback } from 'react'
import { usePagePilotStore } from '../store/usePagePilotStore'
import type { OperationPlan } from '../core/types'
import type { TaskContext } from '../engine/TaskManager'
import { PageUnderstandingEngine } from '../engine/PageUnderstandingEngine'
import { ExecutionEngine } from '../engine/ExecutionEngine'
import { VisualFeedback } from '../engine/VisualFeedback'
import { TaskManager } from '../engine/TaskManager'
import { SafetyEngine } from '../engine/SafetyEngine'
import { OfflineDemoEngine } from '../engine/OfflineDemoEngine'
import type { SitePackConfig } from '../core/types'
import { TaskPanel } from './TaskPanel'
import { SettingsPanel } from './SettingsPanel'
import './AssistantWidget.css'

function buildSuggestions(sitePack: SitePackConfig): { label: string; command: string }[] {
  return sitePack.entries.map((entry) => {
    const wf = sitePack.workflows.find((w) => w.id === entry.workflowId)
    if (!wf) return { label: entry.name, command: entry.name }
    const example = wf.params
      .filter((p) => p.required && p.options)
      .slice(0, 2)
      .map((p) => p.options![0])
      .join('')
    return { label: entry.name, command: example ? `${entry.name}，${example}` : entry.name }
  })
}

function buildExampleSentence(wf: { name: string; params: { label: string; options?: string[]; type: string }[] }): string {
  const parts = wf.params
    .filter((p) => p.options)
    .slice(0, 3)
    .map((p) => p.options![0])
  return parts.length > 0 ? `${wf.name}，${parts.join('、')}` : wf.name
}

function buildCapabilityHint(sitePack: SitePackConfig): string {
  const items = sitePack.entries.map((entry) => {
    const wf = sitePack.workflows.find((w) => w.id === entry.workflowId)
    const example = wf ? buildExampleSentence(wf) : entry.name
    return `• ${entry.name}（如：${example}）`
  })
  return `我目前可以帮你：\n${items.join('\n')}\n\n你也可以问我系统有哪些功能。`
}

let understanding: PageUnderstandingEngine | null = null
let execution: ExecutionEngine | null = null
let feedback: VisualFeedback | null = null
let taskManager: TaskManager | null = null
let safety: SafetyEngine | null = null
let offline: OfflineDemoEngine | null = null
let initialized = false

function ensureEngines(sitePack: SitePackConfig) {
  if (initialized) return
  understanding = new PageUnderstandingEngine()
  feedback = new VisualFeedback()
  execution = new ExecutionEngine(understanding, feedback)
  safety = new SafetyEngine()
  safety.setSitePack(sitePack)
  taskManager = new TaskManager(execution, feedback, safety)
  offline = new OfflineDemoEngine(safety)
  offline.setSitePack(sitePack)
  initialized = true
}

export function AssistantWidget({ sitePack }: { sitePack: SitePackConfig }) {
  const {
    open, setOpen, mode, setMode, messages, addMessage,
    taskCtx, setTaskCtx, settingsOpen, setSettingsOpen,
    pendingConfirm, setPendingConfirm,
  } = usePagePilotStore()

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const confirmResolve = useRef<((v: boolean) => void) | null>(null)

  useEffect(() => {
    ensureEngines(sitePack)
    if (taskManager) {
      taskManager.setStateCallback((ctx: TaskContext) => {
        setTaskCtx({ ...ctx })
        if (ctx.phase === 'completed') {
          addMessage({ role: 'assistant', content: `✓ 任务「${ctx.goal}」已完成！所有步骤执行成功。` })
        } else if (ctx.phase === 'failed') {
          addMessage({ role: 'assistant', content: `✗ 任务执行失败：${ctx.error}\n\n你可以选择：重试 / 跳过 / 放弃`, taskPhase: ctx.phase })
        } else if (ctx.phase === 'cancelled') {
          addMessage({ role: 'assistant', content: '任务已取消。' })
        }
      })
      taskManager.setConfirmCallback((plan: OperationPlan) => {
        setPendingConfirm(plan)
        addMessage({
          role: 'assistant',
          content: `我为你规划了以下操作步骤：\n${plan.steps.map((s, i) => `${i + 1}. ${s.description}${s.riskLevel !== 'low' ? ` [${s.riskLevel === 'medium' ? '需确认' : '已阻止'}]` : ''}`).join('\n')}\n\n请确认是否执行？`,
          plan,
        })
        return new Promise<boolean>((resolve) => {
          confirmResolve.current = resolve
        })
      })
    }
  }, [sitePack, addMessage, setTaskCtx, setPendingConfirm])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const handleConfirm = useCallback((confirmed: boolean) => {
    if (confirmResolve.current) {
      confirmResolve.current(confirmed)
      confirmResolve.current = null
    }
    setPendingConfirm(null)
    if (confirmed) {
      addMessage({ role: 'user', content: '确认执行' })
    } else {
      addMessage({ role: 'user', content: '取消执行' })
    }
  }, [addMessage, setPendingConfirm])

  const handleSend = useCallback(async (text?: string) => {
    const input = text || inputRef.current?.value?.trim()
    if (!input || !offline) return
    if (inputRef.current) inputRef.current.value = ''

    addMessage({ role: 'user', content: input })

    if (taskCtx && (taskCtx.phase === 'failed')) {
      const lower = input.toLowerCase()
      if (lower.includes('重试') || lower.includes('retry')) {
        addMessage({ role: 'assistant', content: '正在重试当前步骤...' })
        await taskManager?.retryStep()
        return
      }
      if (lower.includes('跳过') || lower.includes('skip')) {
        addMessage({ role: 'assistant', content: '跳过当前步骤，继续执行...' })
        await taskManager?.skipStep()
        return
      }
      if (lower.includes('放弃') || lower.includes('取消') || lower.includes('abort')) {
        taskManager?.cancel()
        return
      }
    }

    const answer = offline.answerQuestion(input)
    if (answer && (mode === 'qa' || !offline.matchIntent(input))) {
      setTimeout(() => addMessage({ role: 'assistant', content: answer }), 400)
      return
    }

    const match = offline.matchIntent(input)
    if (!match) {
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: `抱歉，我暂时无法理解「${input}」。\n\n${buildCapabilityHint(sitePack)}`,
        })
      }, 400)
      return
    }

    if (match.missingParams.length > 0) {
      const workflow = match.workflow
      const paramHints = workflow.params
        .filter((p) => match.missingParams.includes(p.label))
        .map((p) => {
          if (p.options) return `• ${p.label}（可选：${p.options.slice(0, 4).join('、')}${p.options.length > 4 ? '等' : ''}）`
          return `• ${p.label}`
        })
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: `我理解你想「${workflow.name}」，但还需要以下信息：\n${paramHints.join('\n')}\n\n请补充完整，例如：「${buildExampleSentence(workflow)}」`,
        })
      }, 400)
      return
    }

    const plan = offline.buildPlan(match)
    understanding?.scan()
    await taskManager?.startTask(match.workflow.name, plan)
  }, [addMessage, mode, offline, taskCtx, taskManager, understanding, sitePack])

  const handleRetry = useCallback(() => { taskManager?.retryStep() }, [])
  const handleSkip = useCallback(() => { taskManager?.skipStep() }, [])
  const handleCancel = useCallback(() => { taskManager?.cancel() }, [])

  return (
    <>
      <button
        className="pp-fab"
        onClick={() => setOpen(!open)}
        aria-label="PagePilot 助手"
        title="PagePilot 页面领航助手"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.9"/>
          <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {taskCtx?.phase === 'executing' && <span className="pp-fab-pulse" />}
      </button>

      {open && (
        <div className="pp-panel" role="dialog" aria-label="PagePilot 助手面板">
          <div className="pp-panel-header">
            <div className="pp-panel-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
                <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>PagePilot</span>
            </div>
            <div className="pp-panel-actions">
              <button className="pp-icon-btn" onClick={() => setSettingsOpen(true)} title="设置" aria-label="设置">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15 1.65 1.65 0 003 14.08V14a2 2 0 014 0v.09c0 .67.44 1.26 1.09 1.49"/>
                </svg>
              </button>
              <button className="pp-icon-btn" onClick={() => setOpen(false)} title="关闭" aria-label="关闭">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="pp-mode-tabs">
            <button className={mode === 'operation' ? 'active' : ''} onClick={() => setMode('operation')}>操作模式</button>
            <button className={mode === 'qa' ? 'active' : ''} onClick={() => setMode('qa')}>问答模式</button>
          </div>

          <div className="pp-messages" ref={listRef}>
            {messages.length === 0 && (
              <div className="pp-empty">
                <p>你好！我是 PagePilot 页面领航助手。</p>
                <p>我可以帮你操作页面、查询信息。试试说：</p>
                <div className="pp-suggestions">
                  {buildSuggestions(sitePack).map((s) => (
                    <button key={s.label} onClick={() => handleSend(s.command)}>{s.label}</button>
                  ))}
                  <button onClick={() => handleSend('系统有哪些功能？')}>了解系统功能</button>
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`pp-msg pp-msg-${msg.role}`}>
                <div className="pp-msg-content">{msg.content}</div>
              </div>
            ))}
            {pendingConfirm && (
              <div className="pp-confirm-bar">
                <button className="pp-btn-confirm" onClick={() => handleConfirm(true)}>确认执行</button>
                <button className="pp-btn-cancel" onClick={() => handleConfirm(false)}>取消</button>
              </div>
            )}
          </div>

          {taskCtx && taskCtx.phase !== 'idle' && taskCtx.phase !== 'completed' && taskCtx.phase !== 'cancelled' && (
            <TaskPanel ctx={taskCtx} onRetry={handleRetry} onSkip={handleSkip} onCancel={handleCancel} />
          )}

          <div className="pp-input-bar">
            <input
              ref={inputRef}
              type="text"
              placeholder={mode === 'operation' ? '描述你想执行的操作...' : '输入你的问题...'}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
              aria-label="输入消息"
            />
            <button className="pp-send-btn" onClick={() => handleSend()} aria-label="发送">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {settingsOpen && <SettingsPanel />}
    </>
  )
}
