import type { SitePackConfig, WorkflowDefinition, OperationPlan, PlanStep, AtomicAction, RiskLevel } from '../core/types'
import { SafetyEngine } from './SafetyEngine'

export interface MatchResult {
  workflow: WorkflowDefinition
  params: Record<string, string>
  missingParams: string[]
  confidence: number
}

export class OfflineDemoEngine {
  private sitePack: SitePackConfig | null = null
  private safety: SafetyEngine

  constructor(safety: SafetyEngine) {
    this.safety = safety
  }

  setSitePack(config: SitePackConfig): void {
    this.sitePack = config
  }

  matchIntent(input: string): MatchResult | null {
    if (!this.sitePack) return null

    let bestMatch: MatchResult | null = null
    let bestScore = 0

    for (const entry of this.sitePack.entries) {
      const score = this.computeScore(input, entry.keywords)
      if (score > bestScore) {
        const workflow = this.sitePack.workflows.find((w) => w.id === entry.workflowId)
        if (workflow) {
          const params = this.extractParams(input, workflow)
          const missingParams = workflow.params
            .filter((p) => p.required && !params[p.name])
            .map((p) => p.label)
          bestMatch = { workflow, params, missingParams, confidence: score }
          bestScore = score
        }
      }
    }

    return bestMatch && bestScore > 0 ? bestMatch : null
  }

  buildPlan(match: MatchResult): OperationPlan {
    const { workflow, params } = match
    const steps: PlanStep[] = workflow.steps.map((step) => {
      const action = this.stepToAction(step.action, step.target, params)
      const risk = this.safety.assessAction(action, step.description)
      return {
        order: step.order,
        action,
        description: step.description,
        riskLevel: risk.level as RiskLevel,
      }
    })

    return {
      taskId: `task-${Date.now()}`,
      workflowName: workflow.name,
      params,
      steps,
    }
  }

  answerQuestion(input: string): string | null {
    if (!this.sitePack) return null

    const sys = this.sitePack.system
    if (input.includes('功能') || input.includes('模块') || input.includes('能做什么')) {
      return `本系统（${sys.name}）包含以下功能模块：\n${sys.modules.map((m) => `• ${m}`).join('\n')}\n\n我可以帮你完成以下操作：\n${this.sitePack.workflows.map((w) => `• ${w.name}：${w.description}`).join('\n')}`
    }

    if (input.includes('导航') || input.includes('菜单') || input.includes('页面')) {
      const navLabels = sys.navigation.map((n) => n.label)
      return `系统包含以下页面：${navLabels.join('、')}。你可以告诉我要去哪个页面，我来帮你导航。`
    }

    if (input.includes('禁止') || input.includes('不能') || input.includes('限制')) {
      return `以下操作被系统禁止：\n${sys.forbiddenActions.map((a) => `⛔ ${a}`).join('\n')}`
    }

    for (const page of this.sitePack.pages) {
      if (input.includes(page.name) || input.includes(page.route.slice(1))) {
        return `「${page.name}」页面能力：\n${page.capabilities.map((c) => `✓ ${c}`).join('\n')}\n\n限制：\n${page.restrictions.map((r) => `✗ ${r}`).join('\n')}`
      }
    }

    return null
  }

  private computeScore(input: string, keywords: string[]): number {
    let hits = 0
    for (const kw of keywords) {
      if (input.includes(kw)) hits++
    }
    return hits / keywords.length
  }

  private extractParams(input: string, workflow: WorkflowDefinition): Record<string, string> {
    const params: Record<string, string> = {}

    for (const param of workflow.params) {
      if (param.options) {
        for (const opt of param.options) {
          if (input.includes(opt)) {
            params[param.name] = opt
            break
          }
        }
      }
      if (param.type === 'date') {
        const dateMatch = input.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/)
        if (dateMatch) {
          params[param.name] = dateMatch[1].replace(/\//g, '-')
        } else {
          const cnDateMatch = input.match(/(\d{1,2})月(\d{1,2})[日号]/)
          if (cnDateMatch) {
            params[param.name] = `2026-${cnDateMatch[1].padStart(2, '0')}-${cnDateMatch[2].padStart(2, '0')}`
          }
        }
      }
      if (param.type === 'string' && param.name === 'classRange') {
        const classMatch = input.match(/(\d+[-–~到]\d+班|全部班级|所有班级)/)
        if (classMatch) {
          params[param.name] = classMatch[0].replace(/[–~到]/, '-')
        }
      }
      if (param.type === 'checkbox-group' && param.options) {
        const matched = param.options.filter((opt) => input.includes(opt))
        if (matched.length > 0) {
          params[param.name] = matched.join(',')
        }
      }
    }

    return params
  }

  private stepToAction(actionType: string, target: string, params: Record<string, string>): AtomicAction {
    switch (actionType) {
      case 'navigate':
        return { type: 'navigate', url: target }
      case 'click':
        return { type: 'click', selector: target }
      case 'fill': {
        const fieldName = this.extractFieldName(target)
        const value = params[fieldName] || ''
        return { type: 'fill', selector: target, value }
      }
      case 'select': {
        const fieldName = this.extractFieldName(target)
        const value = params[fieldName] || ''
        return { type: 'select', selector: target, value }
      }
      case 'read':
        return { type: 'observe', timeout: 800 }
      default:
        return { type: 'click', selector: target }
    }
  }

  private extractFieldName(selector: string): string {
    const match = selector.match(/data-pagepilot-field='([^']+)'/)
    if (match) return match[1]
    const match2 = selector.match(/data-pagepilot-field="([^"]+)"/)
    if (match2) return match2[1]
    return ''
  }
}
