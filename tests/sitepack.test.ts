import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import Ajv from 'ajv'

const root = process.cwd()

function loadJson(relativePath: string) {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf-8'))
}

describe('SitePack Schema Validation', () => {
  const schema = loadJson('sitepack/schema/sitepack.schema.json')
  const instance = loadJson('sitepack/instances/health-exam-admin/sitepack.json')
  const ajv = new Ajv({ allErrors: true })
  const validate = ajv.compile(schema)

  it('health-exam-admin sitepack validates against schema', () => {
    const valid = validate(instance)
    expect(valid).toBe(true)
  })

  it('has required meta fields', () => {
    expect(instance.meta.id).toBe('health-exam-admin')
    expect(instance.meta.name).toBeTruthy()
    expect(instance.meta.match).toBeTruthy()
  })

  it('defines at least 2 workflows for demo', () => {
    expect(instance.workflows.length).toBeGreaterThanOrEqual(2)
    const ids = instance.workflows.map((w: { id: string }) => w.id)
    expect(ids).toContain('create-exam-batch')
    expect(ids).toContain('screen-abnormal-recheck')
  })

  it('each workflow has steps and params', () => {
    for (const wf of instance.workflows) {
      expect(wf.steps.length).toBeGreaterThan(0)
      expect(wf.params.length).toBeGreaterThan(0)
      const requiredParams = wf.params.filter((p: { required: boolean }) => p.required)
      expect(requiredParams.length).toBeGreaterThan(0)
    }
  })

  it('entries reference valid workflow ids', () => {
    const workflowIds = new Set(instance.workflows.map((w: { id: string }) => w.id))
    for (const entry of instance.entries) {
      expect(workflowIds.has(entry.workflowId)).toBe(true)
      expect(entry.keywords.length).toBeGreaterThan(0)
    }
  })

  it('risk rules cover all three levels', () => {
    const levels = new Set(instance.riskRules.map((r: { level: string }) => r.level))
    expect(levels.has('low')).toBe(true)
    expect(levels.has('medium')).toBe(true)
    expect(levels.has('high')).toBe(true)
  })

  it('pages declare capabilities and restrictions', () => {
    for (const page of instance.pages) {
      expect(page.route).toBeTruthy()
      expect(page.capabilities.length).toBeGreaterThan(0)
      expect(page.restrictions.length).toBeGreaterThan(0)
    }
  })

  it('system declares forbidden actions', () => {
    expect(instance.system.forbiddenActions.length).toBeGreaterThan(0)
    expect(instance.system.forbiddenActions).toContain('删除体检数据')
  })
})

describe('PagePilot Core', () => {
  it('can be imported', async () => {
    const { PagePilotCore } = await import('../src/pagepilot/core/PagePilot')
    const core = new PagePilotCore()
    expect(core.isReady()).toBe(false)
  })

  it('registers sitepack and becomes ready', async () => {
    const { PagePilotCore } = await import('../src/pagepilot/core/PagePilot')
    const instance = loadJson('sitepack/instances/health-exam-admin/sitepack.json')
    const core = new PagePilotCore()
    core.registerSitePack(instance)
    expect(core.isReady()).toBe(true)
    expect(core.getSitePack()?.meta.id).toBe('health-exam-admin')
  })

  it('matches workflow by keywords', async () => {
    const { PagePilotCore } = await import('../src/pagepilot/core/PagePilot')
    const instance = loadJson('sitepack/instances/health-exam-admin/sitepack.json')
    const core = new PagePilotCore()
    core.registerSitePack(instance)

    const result = core.matchWorkflow('帮我创建一次体检任务')
    expect(result).not.toBeNull()
    expect(result!.workflow.id).toBe('create-exam-batch')
  })

  it('matches screening workflow by keywords', async () => {
    const { PagePilotCore } = await import('../src/pagepilot/core/PagePilot')
    const instance = loadJson('sitepack/instances/health-exam-admin/sitepack.json')
    const core = new PagePilotCore()
    core.registerSitePack(instance)

    const result = core.matchWorkflow('帮我筛出三年级视力异常的学生')
    expect(result).not.toBeNull()
    expect(result!.workflow.id).toBe('screen-abnormal-recheck')
  })
})
