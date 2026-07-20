import type { SitePackConfig, AtomicAction, RiskLevel, RiskRule } from '../core/types'

export interface RiskAssessment {
  level: RiskLevel
  handling: 'auto' | 'confirm' | 'block'
  rule: RiskRule | null
  description: string
}

export class SafetyEngine {
  private sitePack: SitePackConfig | null = null

  setSitePack(config: SitePackConfig): void {
    this.sitePack = config
  }

  assessAction(action: AtomicAction, context?: string): RiskAssessment {
    if (!this.sitePack) {
      return { level: 'low', handling: 'auto', rule: null, description: '无风险规则配置，默认低风险' }
    }

    const matchTargets = this.extractMatchTargets(action, context)
    for (const rule of this.sitePack.riskRules) {
      if (matchTargets.some((t) => t.includes(rule.action) || rule.action.includes(t))) {
        return {
          level: rule.level,
          handling: rule.handling,
          rule,
          description: rule.description,
        }
      }
    }

    if (action.type === 'navigate' || action.type === 'observe') {
      return { level: 'low', handling: 'auto', rule: null, description: '导航/观察为低风险操作' }
    }

    return { level: 'low', handling: 'auto', rule: null, description: '未匹配风险规则，默认低风险' }
  }

  assessWorkflow(workflowId: string): RiskAssessment {
    if (!this.sitePack) {
      return { level: 'low', handling: 'auto', rule: null, description: '无风险规则' }
    }

    let maxLevel: RiskLevel = 'low'
    let maxHandling: 'auto' | 'confirm' | 'block' = 'auto'
    let matchedRule: RiskRule | null = null

    for (const rule of this.sitePack.riskRules) {
      if (workflowId.includes(rule.action.replace(/-/g, '')) || rule.action.includes(workflowId.split('-')[0])) {
        if (this.levelWeight(rule.level) > this.levelWeight(maxLevel)) {
          maxLevel = rule.level
          maxHandling = rule.handling
          matchedRule = rule
        }
      }
    }

    const workflow = this.sitePack.workflows.find((w) => w.id === workflowId)
    if (workflow) {
      for (const step of workflow.steps) {
        for (const rule of this.sitePack.riskRules) {
          if (step.target.includes(rule.action)) {
            if (this.levelWeight(rule.level) > this.levelWeight(maxLevel)) {
              maxLevel = rule.level
              maxHandling = rule.handling
              matchedRule = rule
            }
          }
        }
      }
    }

    return {
      level: maxLevel,
      handling: maxHandling,
      rule: matchedRule,
      description: matchedRule?.description || '工作流整体风险评估',
    }
  }

  isForbidden(actionDescription: string): boolean {
    if (!this.sitePack) return false
    return this.sitePack.system.forbiddenActions.some(
      (forbidden) => actionDescription.includes(forbidden) || forbidden.includes(actionDescription)
    )
  }

  isWithinCapability(request: string): boolean {
    if (!this.sitePack) return false
    const allCapabilities = this.sitePack.pages.flatMap((p) => p.capabilities)
    const allWorkflows = this.sitePack.workflows.map((w) => w.name)
    const allEntries = this.sitePack.entries.flatMap((e) => e.keywords)
    const knownTerms = [...allCapabilities, ...allWorkflows, ...allEntries]
    return knownTerms.some((term) => request.includes(term) || term.includes(request))
  }

  private extractMatchTargets(action: AtomicAction, context?: string): string[] {
    const targets: string[] = []
    if (action.type === 'click' || action.type === 'fill' || action.type === 'select') {
      targets.push(action.selector)
    }
    if (action.type === 'navigate') targets.push('navigate')
    if (context) targets.push(context)
    targets.push(action.type)
    return targets
  }

  private levelWeight(level: RiskLevel): number {
    switch (level) {
      case 'low': return 0
      case 'medium': return 1
      case 'high': return 2
    }
  }
}
