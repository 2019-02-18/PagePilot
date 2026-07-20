import { describe, it, expect, beforeEach } from 'vitest'
import { SafetyEngine } from '../src/pagepilot/engine/SafetyEngine'
import { OfflineDemoEngine } from '../src/pagepilot/engine/OfflineDemoEngine'
import type { SitePackConfig } from '../src/pagepilot/core/types'
import sitePackJson from '../sitepack/instances/health-exam-admin/sitepack.json'

const sitePack = sitePackJson as unknown as SitePackConfig

describe('OfflineDemoEngine - Demo Flow 1: 创建体检任务', () => {
  let safety: SafetyEngine
  let offline: OfflineDemoEngine

  beforeEach(() => {
    safety = new SafetyEngine()
    safety.setSitePack(sitePack)
    offline = new OfflineDemoEngine(safety)
    offline.setSitePack(sitePack)
  })

  it('matches intent for creating exam batch', () => {
    const result = offline.matchIntent('帮阳光小学三年级创建体检任务')
    expect(result).not.toBeNull()
    expect(result!.workflow.id).toBe('create-exam-batch')
    expect(result!.params.school).toBe('阳光小学')
    expect(result!.params.grade).toBe('三年级')
  })

  it('extracts all params from full natural language input', () => {
    const result = offline.matchIntent('帮阳光小学三年级1-3班在2026-07-25创建体检任务，项目选视力和身高体重')
    expect(result).not.toBeNull()
    expect(result!.params.school).toBe('阳光小学')
    expect(result!.params.grade).toBe('三年级')
    expect(result!.params.classRange).toBe('1-3班')
    expect(result!.params.date).toBe('2026-07-25')
    expect(result!.params.items).toContain('视力')
    expect(result!.params.items).toContain('身高体重')
    expect(result!.missingParams).toHaveLength(0)
  })

  it('reports missing params when input is incomplete', () => {
    const result = offline.matchIntent('创建体检任务')
    expect(result).not.toBeNull()
    expect(result!.missingParams.length).toBeGreaterThan(0)
  })

  it('builds execution plan with correct steps', () => {
    const result = offline.matchIntent('帮阳光小学三年级1-3班在2026-07-25创建体检任务，项目选视力和身高体重')
    const plan = offline.buildPlan(result!)
    expect(plan.workflowName).toBe('创建体检任务')
    expect(plan.steps.length).toBe(8)
    expect(plan.steps[0].action.type).toBe('navigate')
    expect(plan.steps[1].action.type).toBe('click')
    expect(plan.steps[7].action.type).toBe('click')
  })

  it('assesses save-batch as medium risk requiring confirmation', () => {
    const risk = safety.assessAction({ type: 'click', selector: "[data-pagepilot-action='save-batch']" }, '点击保存')
    expect(risk.level).toBe('medium')
    expect(risk.handling).toBe('confirm')
  })
})

describe('OfflineDemoEngine - Demo Flow 2: 筛选异常学生生成复查名单', () => {
  let safety: SafetyEngine
  let offline: OfflineDemoEngine

  beforeEach(() => {
    safety = new SafetyEngine()
    safety.setSitePack(sitePack)
    offline = new OfflineDemoEngine(safety)
    offline.setSitePack(sitePack)
  })

  it('matches intent for screening abnormal students', () => {
    const result = offline.matchIntent('筛选三年级视力异常的学生生成复查名单')
    expect(result).not.toBeNull()
    expect(result!.workflow.id).toBe('screen-abnormal-recheck')
    expect(result!.params.grade).toBe('三年级')
    expect(result!.params.abnormalType).toBe('视力')
  })

  it('builds plan with navigate, select, click, observe steps', () => {
    const result = offline.matchIntent('筛选三年级视力异常的学生生成复查名单')
    const plan = offline.buildPlan(result!)
    expect(plan.workflowName).toBe('筛选异常学生并生成复查名单')
    expect(plan.steps.length).toBe(6)
    expect(plan.steps[0].action).toEqual({ type: 'navigate', url: '/data-detail' })
    expect(plan.steps[1].action.type).toBe('select')
    expect(plan.steps[3].action.type).toBe('click')
    expect(plan.steps[4].action.type).toBe('observe')
    expect(plan.steps[5].action.type).toBe('click')
  })

  it('assesses generate-recheck as medium risk', () => {
    const risk = safety.assessAction(
      { type: 'click', selector: "[data-pagepilot-action='generate-recheck']" },
      '点击生成复查名单'
    )
    expect(risk.level).toBe('medium')
    expect(risk.handling).toBe('confirm')
  })
})

describe('SafetyEngine - Risk Rules', () => {
  let safety: SafetyEngine

  beforeEach(() => {
    safety = new SafetyEngine()
    safety.setSitePack(sitePack)
  })

  it('blocks high-risk delete operations', () => {
    const risk = safety.assessAction({ type: 'click', selector: "[data-pagepilot-action='delete-data']" }, '删除数据')
    expect(risk.level).toBe('high')
    expect(risk.handling).toBe('block')
  })

  it('blocks batch notify operations', () => {
    const risk = safety.assessAction({ type: 'click', selector: "[data-pagepilot-action='batch-notify']" }, '批量通知')
    expect(risk.level).toBe('high')
    expect(risk.handling).toBe('block')
  })

  it('allows low-risk filter query', () => {
    const risk = safety.assessAction({ type: 'click', selector: "[data-pagepilot-action='query']" }, '筛选查询')
    expect(risk.level).toBe('low')
    expect(risk.handling).toBe('auto')
  })

  it('identifies forbidden actions', () => {
    expect(safety.isForbidden('删除体检数据')).toBe(true)
    expect(safety.isForbidden('批量删除学生记录')).toBe(true)
    expect(safety.isForbidden('查看学生数据')).toBe(false)
  })
})

describe('OfflineDemoEngine - QA Mode', () => {
  let safety: SafetyEngine
  let offline: OfflineDemoEngine

  beforeEach(() => {
    safety = new SafetyEngine()
    safety.setSitePack(sitePack)
    offline = new OfflineDemoEngine(safety)
    offline.setSitePack(sitePack)
  })

  it('answers system capability questions', () => {
    const answer = offline.answerQuestion('系统有哪些功能？')
    expect(answer).not.toBeNull()
    expect(answer).toContain('体检任务管理')
    expect(answer).toContain('异常指标筛查')
  })

  it('answers forbidden action questions', () => {
    const answer = offline.answerQuestion('有什么禁止操作？')
    expect(answer).not.toBeNull()
    expect(answer).toContain('删除体检数据')
  })

  it('returns null for unrecognized questions', () => {
    const answer = offline.answerQuestion('今天天气怎么样')
    expect(answer).toBeNull()
  })
})
