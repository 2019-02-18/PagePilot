import type { OperationPlan, PlanStep } from '../core/types'
import { ExecutionEngine, type ExecutionResult } from './ExecutionEngine'
import { VisualFeedback } from './VisualFeedback'
import { SafetyEngine } from './SafetyEngine'

export type TaskPhase = 'idle' | 'understanding' | 'planning' | 'confirming' | 'executing' | 'paused' | 'completed' | 'failed' | 'cancelled'

export interface StepResult {
  step: PlanStep
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
  result?: ExecutionResult
}

export interface TaskContext {
  id: string
  goal: string
  phase: TaskPhase
  plan: OperationPlan | null
  steps: StepResult[]
  currentStepIndex: number
  error: string | null
}

export type TaskEventCallback = (ctx: TaskContext) => void
export type ConfirmCallback = (plan: OperationPlan) => Promise<boolean>

export class TaskManager {
  private execution: ExecutionEngine
  private feedback: VisualFeedback
  private safety: SafetyEngine
  private ctx: TaskContext
  private onStateChange: TaskEventCallback | null = null
  private onConfirmRequest: ConfirmCallback | null = null
  private aborted = false

  constructor(execution: ExecutionEngine, feedback: VisualFeedback, safety: SafetyEngine) {
    this.execution = execution
    this.feedback = feedback
    this.safety = safety
    this.ctx = {
      id: '',
      goal: '',
      phase: 'idle',
      plan: null,
      steps: [],
      currentStepIndex: -1,
      error: null,
    }
  }

  setStateCallback(cb: TaskEventCallback): void {
    this.onStateChange = cb
  }

  setConfirmCallback(cb: ConfirmCallback): void {
    this.onConfirmRequest = cb
  }

  getContext(): TaskContext {
    return { ...this.ctx }
  }

  async startTask(goal: string, plan: OperationPlan): Promise<void> {
    this.aborted = false
    this.ctx = {
      id: plan.taskId,
      goal,
      phase: 'planning',
      plan,
      steps: plan.steps.map((step) => ({ step, status: 'pending' as const })),
      currentStepIndex: -1,
      error: null,
    }
    this.emit()

    this.ctx.phase = 'confirming'
    this.emit()

    if (this.onConfirmRequest) {
      const confirmed = await this.onConfirmRequest(plan)
      if (!confirmed) {
        this.ctx.phase = 'cancelled'
        this.emit()
        return
      }
    }

    await this.executePlan()
  }

  async executePlan(): Promise<void> {
    if (!this.ctx.plan) return
    this.ctx.phase = 'executing'
    this.emit()

    const steps = this.ctx.steps
    for (let i = 0; i < steps.length; i++) {
      if (this.aborted) {
        this.ctx.phase = 'cancelled'
        this.emit()
        return
      }

      this.ctx.currentStepIndex = i
      steps[i].status = 'running'
      this.emit()

      const step = steps[i].step
      this.feedback.showStepBadge(step.description, i + 1, steps.length)

      const risk = this.safety.assessAction(step.action, step.description)
      if (risk.handling === 'block') {
        steps[i].status = 'failed'
        steps[i].result = { success: false, message: `操作被安全策略阻止: ${risk.description}` }
        this.ctx.phase = 'failed'
        this.ctx.error = risk.description
        this.emit()
        this.feedback.hideStepBadge()
        return
      }

      const result = await this.execution.executeAction(step.action)
      steps[i].result = result

      if (result.success) {
        steps[i].status = 'success'
      } else {
        steps[i].status = 'failed'
        this.ctx.phase = 'failed'
        this.ctx.error = result.message
        this.emit()
        this.feedback.hideStepBadge()
        return
      }

      this.emit()
      await this.delay(300)
    }

    this.feedback.hideStepBadge()
    this.feedback.hideCursor()
    this.ctx.phase = 'completed'
    this.ctx.currentStepIndex = steps.length
    this.emit()
  }

  async retryStep(): Promise<void> {
    const idx = this.ctx.currentStepIndex
    if (idx < 0 || idx >= this.ctx.steps.length) return
    this.ctx.steps[idx].status = 'pending'
    this.ctx.error = null
    this.ctx.phase = 'executing'
    this.emit()

    const remaining = this.ctx.steps.slice(idx)
    for (let i = 0; i < remaining.length; i++) {
      const actualIdx = idx + i
      if (this.aborted) {
        this.ctx.phase = 'cancelled'
        this.emit()
        return
      }
      this.ctx.currentStepIndex = actualIdx
      this.ctx.steps[actualIdx].status = 'running'
      this.emit()

      const step = this.ctx.steps[actualIdx].step
      this.feedback.showStepBadge(step.description, actualIdx + 1, this.ctx.steps.length)
      const result = await this.execution.executeAction(step.action)
      this.ctx.steps[actualIdx].result = result

      if (result.success) {
        this.ctx.steps[actualIdx].status = 'success'
      } else {
        this.ctx.steps[actualIdx].status = 'failed'
        this.ctx.phase = 'failed'
        this.ctx.error = result.message
        this.emit()
        this.feedback.hideStepBadge()
        return
      }
      this.emit()
      await this.delay(300)
    }

    this.feedback.hideStepBadge()
    this.feedback.hideCursor()
    this.ctx.phase = 'completed'
    this.emit()
  }

  async skipStep(): Promise<void> {
    const idx = this.ctx.currentStepIndex
    if (idx < 0 || idx >= this.ctx.steps.length) return
    this.ctx.steps[idx].status = 'skipped'
    this.ctx.error = null
    this.ctx.currentStepIndex = idx + 1
    this.emit()

    if (this.ctx.currentStepIndex >= this.ctx.steps.length) {
      this.ctx.phase = 'completed'
      this.emit()
      return
    }
    await this.retryStep()
  }

  pause(): void {
    if (this.ctx.phase === 'executing') {
      this.ctx.phase = 'paused'
      this.emit()
    }
  }

  cancel(): void {
    this.aborted = true
    this.ctx.phase = 'cancelled'
    this.feedback.hideStepBadge()
    this.feedback.hideCursor()
    this.feedback.clearHighlight()
    this.emit()
  }

  reset(): void {
    this.aborted = false
    this.ctx = {
      id: '',
      goal: '',
      phase: 'idle',
      plan: null,
      steps: [],
      currentStepIndex: -1,
      error: null,
    }
    this.feedback.destroy()
    this.emit()
  }

  private emit(): void {
    if (this.onStateChange) this.onStateChange(this.getContext())
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }
}
