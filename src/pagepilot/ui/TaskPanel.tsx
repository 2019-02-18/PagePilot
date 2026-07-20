import type { TaskContext } from '../engine/TaskManager'

interface TaskPanelProps {
  ctx: TaskContext
  onRetry: () => void
  onSkip: () => void
  onCancel: () => void
}

export function TaskPanel({ ctx, onRetry, onSkip, onCancel }: TaskPanelProps) {
  const phaseLabels: Record<string, string> = {
    understanding: '理解中',
    planning: '规划中',
    confirming: '等待确认',
    executing: '执行中',
    paused: '已暂停',
    failed: '执行失败',
  }

  return (
    <div className="pp-task-panel">
      <div className="pp-task-header">
        <span className="pp-task-name">{ctx.goal}</span>
        <span className={`pp-task-phase pp-phase-${ctx.phase}`}>
          {phaseLabels[ctx.phase] || ctx.phase}
        </span>
      </div>
      <div className="pp-task-steps">
        {ctx.steps.map((s, i) => (
          <div key={i} className={`pp-step pp-step-${s.status}`}>
            <span className="pp-step-icon">
              {s.status === 'success' ? '✓' : s.status === 'failed' ? '✗' : s.status === 'running' ? '●' : s.status === 'skipped' ? '⊘' : '○'}
            </span>
            <span className="pp-step-desc">{s.step.description}</span>
          </div>
        ))}
      </div>
      {ctx.phase === 'failed' && (
        <div className="pp-task-actions">
          <button onClick={onRetry} className="pp-btn-retry">重试</button>
          <button onClick={onSkip} className="pp-btn-skip">跳过</button>
          <button onClick={onCancel} className="pp-btn-abort">放弃</button>
        </div>
      )}
    </div>
  )
}
