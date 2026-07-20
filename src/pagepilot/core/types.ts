export type RiskLevel = 'low' | 'medium' | 'high'

export interface SitePackConfig {
  version: string
  meta: SitePackMeta
  system: SystemDescription
  workflows: WorkflowDefinition[]
  entries: EntryDefinition[]
  pages: PageDeclaration[]
  riskRules: RiskRule[]
  dataApis?: DataApiDeclaration[]
  theme?: ThemeConfig
}

export interface SitePackMeta {
  id: string
  name: string
  description: string
  match: SitePackMatch
}

export interface SitePackMatch {
  domain?: string
  pathPrefix?: string
  metaTag?: { name: string; content: string }
}

export interface SystemDescription {
  name: string
  modules: string[]
  navigation: NavNode[]
  forbiddenActions: string[]
}

export interface NavNode {
  label: string
  path?: string
  children?: NavNode[]
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  params: WorkflowParam[]
}

export interface WorkflowStep {
  order: number
  action: string
  target: string
  description: string
}

export interface WorkflowParam {
  name: string
  label: string
  type: 'string' | 'select' | 'date' | 'checkbox-group'
  required: boolean
  options?: string[]
}

export interface EntryDefinition {
  id: string
  name: string
  workflowId: string
  keywords: string[]
}

export interface PageDeclaration {
  route: string
  name: string
  capabilities: string[]
  restrictions: string[]
}

export interface RiskRule {
  action: string
  level: RiskLevel
  handling: 'auto' | 'confirm' | 'block'
  description: string
}

export interface DataApiDeclaration {
  id: string
  name: string
  purpose: string
  status: 'active' | 'reserved'
}

export interface ThemeConfig {
  brandColor: string
  assistantPalette?: string
}

export interface PageSnapshot {
  url: string
  title: string
  navItems: NavItemInfo[]
  buttons: ButtonInfo[]
  forms: FormInfo[]
  tables: TableInfo[]
  overlays: OverlayInfo[]
}

export interface NavItemInfo {
  label: string
  selector: string
  active: boolean
}

export interface ButtonInfo {
  label: string
  selector: string
  variant: string
}

export interface FormInfo {
  selector: string
  fields: FieldInfo[]
}

export interface FieldInfo {
  label: string
  selector: string
  type: string
  required: boolean
  value: string
}

export interface TableInfo {
  selector: string
  columns: string[]
  rowCount: number
}

export interface OverlayInfo {
  type: 'modal' | 'drawer'
  selector: string
  title: string
  visible: boolean
}

export type AtomicAction =
  | { type: 'click'; selector: string }
  | { type: 'fill'; selector: string; value: string }
  | { type: 'select'; selector: string; value: string }
  | { type: 'navigate'; url: string }
  | { type: 'observe'; timeout?: number }

export interface OperationPlan {
  taskId: string
  workflowName: string
  params: Record<string, string>
  steps: PlanStep[]
}

export interface PlanStep {
  order: number
  action: AtomicAction
  description: string
  riskLevel: RiskLevel
}

export type TaskStatus = 'idle' | 'understanding' | 'planning' | 'confirming' | 'executing' | 'completed' | 'failed'

export interface Task {
  id: string
  goal: string
  status: TaskStatus
  plan?: OperationPlan
  result?: TaskResult
}

export interface TaskResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

export interface StepCallback {
  (step: PlanStep, index: number, total: number): void
}
