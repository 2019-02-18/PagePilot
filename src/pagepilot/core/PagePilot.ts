import type { SitePackConfig, AtomicAction, RiskLevel } from './types'

export class PagePilotCore {
  private sitePack: SitePackConfig | null = null
  private initialized = false

  registerSitePack(config: SitePackConfig): void {
    this.sitePack = config
    this.initialized = true
  }

  isReady(): boolean {
    return this.initialized && this.sitePack !== null
  }

  getSitePack(): SitePackConfig | null {
    return this.sitePack
  }

  matchWorkflow(input: string): { workflow: SitePackConfig['workflows'][0]; params: Record<string, string> } | null {
    if (!this.sitePack) return null
    for (const entry of this.sitePack.entries) {
      if (entry.keywords.some((kw) => input.includes(kw))) {
        const workflow = this.sitePack.workflows.find((w) => w.id === entry.workflowId)
        if (workflow) return { workflow, params: {} }
      }
    }
    return null
  }

  assessRisk(action: AtomicAction): RiskLevel {
    if (!this.sitePack) return 'low'
    for (const rule of this.sitePack.riskRules) {
      if (action.type === 'click' && action.selector.includes(rule.action)) {
        return rule.level
      }
    }
    return 'low'
  }
}

export const pagePilot = new PagePilotCore()
